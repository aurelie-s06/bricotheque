import { setTimeout as sleep } from 'node:timers/promises'
import { DateTime } from 'luxon'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import env from '#start/env'
import ImportRun from '#models/import_run'
import ClaudeBatchApi, {
  TRANSLATION_MODEL,
  type TranslationBatchApi,
} from '#services/translation/claude_batch_api'
import DescriptionTranslator from '#services/translation/description_translator'

/**
 * Batch prices of the translation model (50 % of the standard
 * $4 / $20 per million tokens of Claude Opus 5.5, as of 2026-11-03).
 */
const BATCH_PRICE_PER_MILLION = { input: 2, output: 10 }

/** Rough estimate: ~3.5 characters per token, French ~15 % longer, plus prompt and thinking */
export function estimateCost(count: number, characters: number) {
  const inputTokens = characters / 3.5 + count * 300
  const outputTokens = (characters * 1.15) / 3.5 + count * 300
  return (
    (inputTokens * BATCH_PRICE_PER_MILLION.input + outputTokens * BATCH_PRICE_PER_MILLION.output) /
    1_000_000
  )
}

const notAvailable = () => {
  throw new Error('Aucun appel à Claude en mode --dry-run')
}
const DRY_RUN_API: TranslationBatchApi = {
  createBatch: notAvailable,
  batchStatus: notAvailable,
  results: notAvailable,
  translateNow: notAvailable,
}

export default class TranslateDescriptions extends BaseCommand {
  static commandName = 'translate:descriptions'
  static description = `Translate the Brickset descriptions into French with Claude (${TRANSLATION_MODEL}, Batches API)`
  static help = [
    'Sends the descriptions without an up-to-date French translation as one batch.',
    'Run it again later to save the results (most batches end within an hour).',
    '',
    '{{ binaryName }} translate:descriptions --dry-run    (count and estimated cost, sends nothing)',
    '{{ binaryName }} translate:descriptions --set=75192-1  (one set, immediately)',
    '{{ binaryName }} translate:descriptions --limit=20 --wait',
    '{{ binaryName }} translate:descriptions --yes          (no confirmation, for cron)',
  ]

  static options: CommandOptions = {
    startApp: true,
  }

  /** Lets the tests inject a fake API */
  static apiFactory: (() => TranslationBatchApi) | undefined
  /** Delay between two status checks with --wait */
  static pollMs = 60_000

  @flags.boolean({ description: 'Show what would be translated and the estimated cost' })
  declare dryRun: boolean

  @flags.number({ description: 'Translate at most N descriptions (tests)' })
  declare limit?: number

  @flags.boolean({ description: 'Wait for the batch to end and save the results' })
  declare wait: boolean

  @flags.boolean({ description: 'Do not ask for confirmation before sending' })
  declare yes: boolean

  @flags.string({ description: 'Translate a single set immediately (e.g. 75192-1)' })
  declare set?: string

  #warnings = 0

  async run() {
    try {
      // --dry-run only reads the database: no API key needed
      const api = this.dryRun
        ? DRY_RUN_API
        : (TranslateDescriptions.apiFactory?.() ?? this.#createApi())
      const translator = new DescriptionTranslator(api, (message) => this.#warn(message))

      if (this.set) {
        const text = await translator.translateOne(this.set)
        this.logger.success(`Set ${this.set} traduit :`)
        this.logger.log(text)
        return
      }

      const running = await ImportRun.query()
        .where({ source: 'translation', type: 'descriptions', status: 'running' })
        .orderBy('id', 'desc')
        .first()

      if (running) {
        await this.#follow(running, api, translator)
        return
      }

      await this.#submit(translator, api)
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error))
      this.exitCode = 1
    }
  }

  async #submit(translator: DescriptionTranslator, api: TranslationBatchApi) {
    const summary = await translator.summary()
    if (summary.count === 0) {
      this.logger.success('Toutes les descriptions sont déjà traduites.')
      return
    }

    const count = this.limit ? Math.min(this.limit, summary.count) : summary.count
    const characters = Math.round((summary.characters * count) / summary.count)
    const cost = estimateCost(count, characters)
    this.logger.info(
      `${count} description(s) à traduire (${characters.toLocaleString('fr-FR')} caractères), ` +
        `coût estimé ≈ ${cost.toFixed(2)} $ avec ${TRANSLATION_MODEL} (API Batches, -50 %)`
    )
    if (this.dryRun) {
      return
    }

    if (!this.yes) {
      const confirmed = await this.prompt.confirm('Envoyer ces descriptions à Claude ?')
      if (!confirmed) {
        this.logger.info('Annulé, rien n’a été envoyé.')
        return
      }
    }

    const { batchId } = await translator.submit(this.limit)
    const run = await ImportRun.create({
      source: 'translation',
      type: 'descriptions',
      status: 'running',
      startedAt: DateTime.utc(),
      cursor: { batchId, count },
    })
    this.logger.success(`Lot ${batchId} envoyé (${count} descriptions).`)

    if (this.wait) {
      await this.#follow(run, api, translator)
    } else {
      this.logger.info(
        'Claude traite le lot (en général moins d’une heure). Relance cette commande plus tard pour enregistrer les traductions.'
      )
    }
  }

  /**
   * Checks the batch of a running import; saves the results once it ended.
   */
  async #follow(run: ImportRun, api: TranslationBatchApi, translator: DescriptionTranslator) {
    const batchId = String(run.cursor?.batchId ?? '')
    if (!batchId) {
      run.merge({ status: 'failed', error: 'Lot sans identifiant', finishedAt: DateTime.utc() })
      await run.save()
      throw new Error('Traduction en cours sans identifiant de lot : relance la commande')
    }

    let status = await api.batchStatus(batchId)
    while (!status.ended && this.wait) {
      this.logger.log(
        this.colors.dim(
          `  en cours : ${status.processing} à traiter, ${status.succeeded} traduites`
        )
      )
      await sleep(TranslateDescriptions.pollMs)
      status = await api.batchStatus(batchId)
    }

    if (!status.ended) {
      this.logger.info(
        `Lot ${batchId} en cours : ${status.succeeded} traduites, ${status.processing} à traiter. Relance plus tard.`
      )
      return
    }

    const stats = await translator.apply(batchId)
    run.merge({
      status: 'completed',
      stats: { ...stats },
      finishedAt: DateTime.utc(),
    })
    await run.save()

    const table = this.ui.table()
    table.head(['Enregistrées', 'Description modifiée entre-temps', 'Échecs'])
    table.row([String(stats.saved), String(stats.stale), String(stats.failed)])
    table.render()
    if (stats.failed || stats.stale) {
      this.logger.info('Relance la commande pour retraduire les descriptions manquantes.')
    }
  }

  #createApi() {
    return new ClaudeBatchApi(env.get('ANTHROPIC_API_KEY')?.release() ?? '')
  }

  #warn(message: string) {
    this.#warnings++
    if (this.#warnings <= 20) {
      this.logger.warning(message)
    } else if (this.#warnings === 21) {
      this.logger.warning('… avertissements suivants masqués')
    }
  }
}
