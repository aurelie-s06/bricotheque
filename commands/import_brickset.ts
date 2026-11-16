import { DateTime } from 'luxon'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import env from '#start/env'
import ImportRun from '#models/import_run'
import { trackImportRun } from '#services/import_run_tracker'
import BricksetClient from '#services/brickset/brickset_client'
import BricksetImporter, {
  type BricksetCursor,
  type BricksetStats,
  type ImportOutcome,
} from '#services/brickset/brickset_importer'
import type { BricksetApi } from '#services/brickset/types'

/** How many warnings are printed before only counting them */
const MAX_PRINTED_WARNINGS = 20

export default class ImportBrickset extends BaseCommand {
  static commandName = 'import:brickset'
  static description =
    'Enrich sets with Brickset data (prices, availability dates, subtheme, description)'
  static help = [
    'Fetches sets year by year (pages of 500) with the Brickset API v3.',
    'Stops cleanly before the daily getSets quota and can resume the next day.',
    '',
    '{{ binaryName }} import:brickset',
    '{{ binaryName }} import:brickset --resume   (does nothing when there is nothing to resume)',
    '{{ binaryName }} import:brickset --set=75192-1',
  ]

  static options: CommandOptions = {
    startApp: true,
  }

  /**
   * Lets the tests inject a fake Brickset API.
   */
  static apiFactory: (() => BricksetApi) | undefined

  /**
   * Lets the tests use their own cache directory (never the real one).
   */
  static cacheDirectory: string | undefined

  @flags.string({ description: 'Enrich a single set (e.g. 75192-1)' })
  declare set?: string

  @flags.boolean({ description: 'Resume the last interrupted import where it stopped' })
  declare resume: boolean

  @flags.boolean({ description: 'Ignore the cached API responses' })
  declare refresh: boolean

  #warnings = 0

  async run() {
    try {
      const api = ImportBrickset.apiFactory?.() ?? this.#createClient()
      if (!(await api.checkKey())) {
        throw new Error('Clé API Brickset refusée : vérifie BRICKSET_API_KEY dans .env')
      }

      if (this.set) {
        const outcome = await trackImportRun('brickset', 'set', async () => {
          const result = await this.#importer(api).importOne(this.set!)
          return result.stats
        })
        this.#printSummary({ stats: outcome, finished: true, quotaUsed: -1 })
        return
      }

      await this.#importAll(api)
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error))
      this.exitCode = 1
    }
  }

  async #importAll(api: BricksetApi) {
    const resumeFrom = this.resume ? await this.#lastCursor() : undefined
    if (this.resume && !resumeFrom) {
      // Safe to schedule every day: nothing happens once the import is complete
      this.logger.info('Aucun import interrompu à reprendre : rien à faire')
      return
    }
    if (resumeFrom) {
      const year = resumeFrom.years[resumeFrom.yearIndex]
      this.logger.info(`Reprise à l'année ${year}, page ${resumeFrom.page}`)
    }

    await ImportRun.query()
      .where({ source: 'brickset', type: 'sets', status: 'running' })
      .update({ status: 'interrupted' })

    const run = await ImportRun.create({
      source: 'brickset',
      type: 'sets',
      status: 'running',
      startedAt: DateTime.utc(),
      cursor: resumeFrom ?? null,
    })

    const importer = this.#importer(api, async (cursor, stats) => {
      run.merge({ cursor, stats })
      await run.save()
    })

    let outcome: ImportOutcome
    try {
      outcome = await importer.importAll(resumeFrom)
    } catch (error) {
      run.merge({
        status: 'failed',
        error: error instanceof Error ? (error.stack ?? error.message) : String(error),
        finishedAt: DateTime.utc(),
      })
      await run.save()
      throw error
    }

    run.merge({
      status: outcome.finished ? 'completed' : 'interrupted',
      stats: outcome.stats,
      cursor: outcome.finished ? null : outcome.cursor,
      finishedAt: DateTime.utc(),
    })
    await run.save()

    this.#printSummary(outcome)
    if (!outcome.finished) {
      const year = outcome.cursor.years[outcome.cursor.yearIndex]
      this.logger.warning(
        `Quota Brickset presque atteint : arrêt à l'année ${year}, page ${outcome.cursor.page}. ` +
          `Reprends demain avec : node ace import:brickset --resume`
      )
    }
  }

  async #lastCursor(): Promise<BricksetCursor | undefined> {
    const last = await ImportRun.query()
      .where({ source: 'brickset', type: 'sets' })
      .orderBy('id', 'desc')
      .first()
    if (!last || last.status === 'completed' || !last.cursor) {
      return undefined
    }
    return last.cursor as BricksetCursor
  }

  #createClient() {
    return new BricksetClient(env.get('BRICKSET_API_KEY')?.release() ?? '')
  }

  #importer(api: BricksetApi, onCursor?: (cursor: BricksetCursor, stats: BricksetStats) => void) {
    return new BricksetImporter(api, {
      dailyLimit: env.get('BRICKSET_DAILY_LIMIT') ?? 100,
      cacheDirectory: ImportBrickset.cacheDirectory ?? this.app.tmpPath('brickset'),
      cacheHours: this.refresh ? 0 : 20,
      delayMs: ImportBrickset.apiFactory ? 0 : 1000,
      onProgress: (message) => this.logger.log(this.colors.dim(`  ${message}`)),
      onWarning: (message) => this.#warn(message),
      onCursor,
    })
  }

  #warn(message: string) {
    this.#warnings++
    if (this.#warnings <= MAX_PRINTED_WARNINGS) {
      this.logger.warning(message)
    } else if (this.#warnings === MAX_PRINTED_WARNINGS + 1) {
      this.logger.warning('… avertissements suivants masqués')
    }
  }

  #printSummary(outcome: { stats: BricksetStats; finished: boolean; quotaUsed: number }) {
    const { stats } = outcome
    const table = this.ui.table()
    table.head([
      'Sets Brickset',
      'Mis à jour',
      'Inchangés',
      'Hors catalogue',
      'Erreurs',
      'Appels API',
      'Pages en cache',
      'Statuts changés',
    ])
    table.row([
      String(stats.read),
      String(stats.updated),
      String(stats.unchanged),
      String(stats.skipped),
      String(stats.errors),
      String(stats.apiCalls),
      String(stats.cachedPages),
      String(stats.availabilityChanged),
    ])
    table.render()

    if (outcome.quotaUsed >= 0) {
      const limit = env.get('BRICKSET_DAILY_LIMIT') ?? 100
      this.logger.info(`Appels getSets aujourd'hui : ${outcome.quotaUsed}/${limit}`)
    }
  }
}
