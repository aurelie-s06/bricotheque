import { createHash } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import { nowForSql } from '#services/rebrickable/bulk'
import type { TranslationBatchApi } from '#services/translation/claude_batch_api'

export function sha1(text: string) {
  return createHash('sha1').update(text).digest('hex')
}

/**
 * custom_id of a batch request: the set id plus the start of the hash of
 * the English text. If Brickset changes the description while the batch
 * runs, the result no longer matches and is not saved.
 */
export function customIdFor(setId: number, description: string) {
  return `set-${setId}-${sha1(description).slice(0, 12)}`
}

function parseCustomId(customId: string) {
  const match = /^set-(\d+)-([0-9a-f]{12})$/.exec(customId)
  return match ? { setId: Number(match[1]), hashPrefix: match[2] } : null
}

export type PendingSummary = { count: number; characters: number }

export type ApplyStats = { saved: number; stale: number; failed: number }

/**
 * Translates the Brickset descriptions (English) into French with Claude
 * and stores them in sets.description_fr. Only descriptions that are new
 * or changed since their last translation are sent.
 */
export default class DescriptionTranslator {
  constructor(
    private api: TranslationBatchApi,
    private onWarning: (message: string) => void = () => {}
  ) {}

  /**
   * Sets whose description has no up-to-date translation. The hash is
   * computed here rather than in SQL (SHA1() is not available everywhere).
   */
  async pending(limit?: number): Promise<{ id: number; description: string }[]> {
    const rows: { id: number; description: string; description_fr_source_hash: string | null }[] =
      await db
        .from('sets')
        .whereNotNull('description')
        .select('id', 'description', 'description_fr_source_hash')
        .orderBy('id')
    const pending = rows
      .filter((row) => row.description_fr_source_hash !== sha1(row.description))
      .map((row) => ({ id: row.id, description: row.description }))
    return limit ? pending.slice(0, limit) : pending
  }

  async summary(): Promise<PendingSummary> {
    const pending = await this.pending()
    return {
      count: pending.length,
      characters: pending.reduce((total, set) => total + set.description.length, 0),
    }
  }

  /**
   * Sends the pending descriptions as one batch and returns its id
   * (null when there is nothing to translate).
   */
  async submit(limit?: number): Promise<{ batchId: string | null; count: number }> {
    const sets = await this.pending(limit)
    if (sets.length === 0) {
      return { batchId: null, count: 0 }
    }
    const batchId = await this.api.createBatch(
      sets.map((set) => ({ customId: customIdFor(set.id, set.description), text: set.description }))
    )
    return { batchId, count: sets.length }
  }

  /**
   * Saves the results of an ended batch. A result is skipped when the
   * English description changed since it was sent.
   */
  async apply(batchId: string): Promise<ApplyStats> {
    const stats: ApplyStats = { saved: 0, stale: 0, failed: 0 }
    const translatedAt = nowForSql()

    for await (const result of this.api.results(batchId)) {
      const parsed = parseCustomId(result.customId)
      if (!parsed) {
        stats.failed++
        this.onWarning(`Résultat inattendu : ${result.customId}`)
        continue
      }
      if (result.status === 'failed') {
        stats.failed++
        this.onWarning(`Set ${parsed.setId} non traduit : ${result.reason}`)
        continue
      }

      const set = await db.from('sets').where('id', parsed.setId).select('description').first()
      const hash = set?.description ? sha1(set.description) : null
      if (!hash || !hash.startsWith(parsed.hashPrefix)) {
        stats.stale++
        continue
      }

      await db.from('sets').where('id', parsed.setId).update({
        description_fr: result.text,
        description_fr_source_hash: hash,
        description_fr_translated_at: translatedAt,
      })
      stats.saved++
    }
    return stats
  }

  /** One set, synchronously (debug) */
  async translateOne(setNum: string) {
    const set = await db.from('sets').where('set_num', setNum).select('id', 'description').first()
    if (!set) {
      throw new Error(`Set ${setNum} introuvable`)
    }
    if (!set.description) {
      throw new Error(`Le set ${setNum} n'a pas de description Brickset`)
    }
    const text = await this.api.translateNow(set.description)
    await db
      .from('sets')
      .where('id', set.id)
      .update({
        description_fr: text,
        description_fr_source_hash: sha1(set.description),
        description_fr_translated_at: nowForSql(),
      })
    return text
  }
}
