import { randomBytes } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { makeSlug } from '#services/rebrickable/parsing'
import { parseLocked, serializeLocked } from '#services/catalogue/locked_fields'
import { nowForSql } from '#services/rebrickable/bulk'

export type Kind = 'sets' | 'minifigs'

/** Suffix of the number of a set added by hand: "76999-1~m" */
export const MANUAL_SUFFIX = '~m'

const TABLES = {
  sets: { table: 'sets', key: 'set_num', userTable: 'user_sets', userKey: 'set_id' },
  minifigs: {
    table: 'minifigs',
    key: 'fig_num',
    userTable: 'user_minifigs',
    userKey: 'minifig_id',
  },
} as const

export class MergeError extends Error {}

/** "76999-1~m" → "76999-1" */
export function baseNumber(number: string) {
  return number.endsWith(MANUAL_SUFFIX) ? number.slice(0, -MANUAL_SUFFIX.length) : number
}

export type NewSet = {
  number: string
  variant: number
  name: string
  year: number | null
  themeId: number
  numParts: number
  description: string | null
}

export type NewMinifig = { name: string; numParts: number; yearFirst: number | null }

/**
 * Sets and minifigs added by hand, and their merge into the same item when
 * it arrives from the imports. The merge is always decided by an
 * administrator: the imported data wins, except the fields corrected by
 * hand; collections, wishlists, translation and manual picture are kept.
 */
export default class ManualItems {
  /** Real number of a new set ("76999-1"), to check it is not in the catalogue yet */
  static setNum(number: string, variant: number) {
    return `${number}-${variant}`
  }

  static async setExists(setNum: string) {
    const row = await db
      .from('sets')
      .whereIn('set_num', [setNum, `${setNum}${MANUAL_SUFFIX}`])
      .first()
    return Boolean(row)
  }

  static async createSet(data: NewSet) {
    const setNum = `${this.setNum(data.number, data.variant)}${MANUAL_SUFFIX}`
    const now = nowForSql()
    const [id] = await db.table('sets').insert({
      set_num: setNum,
      number: data.number,
      variant: data.variant,
      name: data.name,
      slug: makeSlug(data.name, 'set'),
      year: data.year,
      theme_id: data.themeId,
      num_parts: data.numParts,
      description: data.description,
      kind: 'set',
      is_manual: true,
      created_at: now,
      updated_at: now,
    })
    return Number(id)
  }

  static async createMinifig(data: NewMinifig) {
    const now = nowForSql()
    const [id] = await db.table('minifigs').insert({
      // Rebrickable numbers ("fig-012345") are unknown in advance
      fig_num: `manual-${randomBytes(4).toString('hex')}`,
      name: data.name,
      slug: makeSlug(data.name, 'minifig'),
      num_parts: data.numParts,
      year_first: data.yearFirst,
      is_manual: true,
      created_at: now,
      updated_at: now,
    })
    return Number(id)
  }

  /**
   * Items added by hand, with the imported items that look like the same
   * (same number for a set, same name).
   */
  static async list(kind: Kind) {
    const { table, key } = TABLES[kind]
    const manual: { id: number; number: string; name: string; slug: string }[] = await db
      .from(table)
      .where('is_manual', true)
      .orderBy('created_at', 'desc')
      .select('id', `${key} as number`, 'name', 'slug')
    if (manual.length === 0) return []

    const names = manual.map((item) => item.name)
    const numbers = kind === 'sets' ? manual.map((item) => baseNumber(item.number)) : []
    const candidates: { id: number; number: string; name: string; slug: string }[] = await db
      .from(table)
      .where('is_manual', false)
      .where((query) => {
        // The column collation ignores case
        query.whereIn('name', names)
        if (numbers.length) query.orWhereIn(key, numbers)
      })
      .select('id', `${key} as number`, 'name', 'slug')
      .limit(500)

    return manual.map((item) => ({
      ...item,
      duplicates: candidates.filter(
        (candidate) =>
          candidate.name.toLowerCase() === item.name.toLowerCase() ||
          (kind === 'sets' && candidate.number === baseNumber(item.number))
      ),
    }))
  }

  /** Number of items added by hand that have a probable duplicate to merge */
  static async pendingMerges() {
    const [sets, minifigs] = await Promise.all([this.list('sets'), this.list('minifigs')])
    return [...sets, ...minifigs].filter((item) => item.duplicates.length > 0).length
  }

  /** Finds the imported item by its number ("76999-1", "76999" or "fig-012345") */
  static async findImported(kind: Kind, number: string) {
    const { table, key } = TABLES[kind]
    const value = number.trim().toLowerCase()
    const values = kind === 'sets' && !value.includes('-') ? [`${value}-1`, value] : [value]
    return db.from(table).where('is_manual', false).whereIn(key, values).select('id').first()
  }

  /**
   * Moves everything from the manual item to the imported one, then deletes
   * the manual item.
   */
  static async merge(kind: Kind, manualId: number, targetId: number) {
    const { table, userTable, userKey } = TABLES[kind]
    await db.transaction(async (trx) => {
      const manual = await trx.from(table).where('id', manualId).forUpdate().first()
      const target = await trx.from(table).where('id', targetId).forUpdate().first()
      if (!manual || !manual.is_manual) throw new MergeError('admin.merge.notManual')
      if (!target || target.is_manual) throw new MergeError('admin.merge.notImported')

      await this.#moveCollections(trx, userTable, userKey, manualId, targetId)

      // Fields corrected by hand on the manual item stay corrected
      const locked = parseLocked(manual.locked_fields)
      const targetLocked = parseLocked(target.locked_fields)
      const values: Record<string, unknown> = {}
      for (const column of locked) {
        values[column] = manual[column]
        targetLocked.add(column)
      }
      if (!target.img_url_manual && manual.img_url_manual) {
        values.img_url_manual = manual.img_url_manual
      }
      if (kind === 'sets' && !target.description_fr && manual.description_fr) {
        values.description_fr = manual.description_fr
        values.description_fr_source_hash = manual.description_fr_source_hash
        values.description_fr_translated_at = manual.description_fr_translated_at
      }
      values.locked_fields = serializeLocked(targetLocked)
      values.updated_at = nowForSql()
      await trx.from(table).where('id', targetId).update(values)

      // Links, collections left: deleted in cascade
      await trx.from(table).where('id', manualId).delete()
    })
  }

  /** Same user and status on both items: one row, with the largest quantity */
  static async #moveCollections(
    trx: TransactionClientContract,
    userTable: string,
    userKey: string,
    manualId: number,
    targetId: number
  ) {
    const rows: { id: number; user_id: number; status: string; quantity: number }[] = await trx
      .from(userTable)
      .where(userKey, manualId)
      .select('id', 'user_id', 'status', 'quantity')
    for (const row of rows) {
      const existing = await trx
        .from(userTable)
        .where(userKey, targetId)
        .where('user_id', row.user_id)
        .where('status', row.status)
        .first()
      if (existing) {
        await trx
          .from(userTable)
          .where('id', existing.id)
          .update({ quantity: Math.max(Number(existing.quantity), Number(row.quantity)) })
        await trx.from(userTable).where('id', row.id).delete()
      } else {
        await trx
          .from(userTable)
          .where('id', row.id)
          .update({ [userKey]: targetId })
      }
    }
  }
}
