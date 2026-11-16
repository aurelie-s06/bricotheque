import { isAbsolute } from 'node:path'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { trackImportRun } from '#services/import_run_tracker'
import RebrickableImporter, { type ImportStats } from '#services/rebrickable/rebrickable_importer'
import SetMinifigLinker, { type AggregateStats } from '#services/rebrickable/set_minifig_linker'
import {
  downloadDump,
  dumpExists,
  dumpPath,
  type RebrickableDump,
} from '#services/rebrickable/dumps'

const STEPS = ['themes', 'sets', 'minifigs'] as const
type Step = (typeof STEPS)[number]

/** CSV files needed by each step */
const DUMPS: Record<Step, RebrickableDump[]> = {
  themes: ['themes'],
  sets: ['sets'],
  minifigs: ['minifigs', 'inventories', 'inventory_minifigs'],
}

/** How many warnings are printed before only counting them */
const MAX_PRINTED_WARNINGS = 20

type Result = { label: string; stats: ImportStats }

export default class ImportRebrickable extends BaseCommand {
  static commandName = 'import:rebrickable'
  static description =
    'Import the Rebrickable catalogue (themes, sets, minifigs and their links) from its CSV dumps'
  static help = [
    'Downloads the gzipped CSV files into tmp/rebrickable, then upserts them.',
    'Running it again updates existing rows and never creates duplicates.',
    '',
    '{{ binaryName }} import:rebrickable',
    '{{ binaryName }} import:rebrickable --skip-download',
    '{{ binaryName }} import:rebrickable --only=minifigs',
  ]

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ description: 'Reuse the CSV files already downloaded' })
  declare skipDownload: boolean

  @flags.string({ description: `Import only some data (comma separated: ${STEPS.join(', ')})` })
  declare only?: string

  @flags.string({ description: 'Directory of the CSV files', default: 'tmp/rebrickable' })
  declare dir: string

  #warnings = 0

  async run() {
    const steps = this.#selectedSteps()
    if (!steps) {
      return
    }
    const directory = isAbsolute(this.dir) ? this.dir : this.app.makePath(this.dir)

    try {
      for (const step of steps) {
        for (const dump of DUMPS[step]) {
          await this.#prepareDump(directory, dump)
        }
      }

      const results: Result[] = []
      let aggregates: AggregateStats | undefined
      for (const step of steps) {
        this.logger.info(`Import : ${step}`)
        if (step === 'minifigs') {
          aggregates = await this.#importMinifigs(directory, results)
        } else {
          const stats = await trackImportRun('rebrickable', step, () =>
            step === 'themes'
              ? this.#importer().importThemes(dumpPath(directory, 'themes'))
              : this.#importer().importSets(dumpPath(directory, 'sets'))
          )
          results.push({ label: step, stats })
        }
      }

      this.#printSummary(results, aggregates)
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error))
      this.exitCode = 1
    }
  }

  /**
   * Minifigs, then their links with the sets (latest inventory version),
   * then the computed fields: sets.num_minifigs, minifigs.main_theme_id
   * and minifigs.year_first.
   */
  async #importMinifigs(directory: string, results: Result[]) {
    const minifigs = await trackImportRun('rebrickable', 'minifigs', () =>
      this.#importer().importMinifigs(dumpPath(directory, 'minifigs'))
    )
    results.push({ label: 'minifigs', stats: minifigs })

    const linker = new SetMinifigLinker({
      onProgress: (read) => this.#logProgress(read),
      onWarning: (message) => this.#warn(message),
    })

    let aggregates: AggregateStats | undefined
    const links = await trackImportRun('rebrickable', 'set_minifigs', async () => {
      const stats = await linker.importLinks(
        dumpPath(directory, 'inventories'),
        dumpPath(directory, 'inventory_minifigs')
      )
      this.logger.info('Calcul : nombre de minifigs par set, thème principal et année des minifigs')
      aggregates = await linker.refreshAggregates()
      return { ...stats, ...aggregates }
    })
    results.push({ label: 'liens sets ↔ minifigs', stats: links })

    return aggregates
  }

  #importer() {
    return new RebrickableImporter({
      onProgress: (read) => this.#logProgress(read),
      onWarning: (message) => this.#warn(message),
    })
  }

  #logProgress(read: number) {
    if (read % 5000 < 500) {
      this.logger.log(this.colors.dim(`  ${read.toLocaleString('fr-FR')} lignes lues`))
    }
  }

  #warn(message: string) {
    this.#warnings++
    if (this.#warnings <= MAX_PRINTED_WARNINGS) {
      this.logger.warning(message)
    } else if (this.#warnings === MAX_PRINTED_WARNINGS + 1) {
      this.logger.warning('… avertissements suivants masqués (voir le résumé)')
    }
  }

  #selectedSteps(): Step[] | undefined {
    if (!this.only) {
      return [...STEPS]
    }
    const requested = this.only.split(',').map((value) => value.trim())
    const unknown = requested.filter((value) => !STEPS.includes(value as Step))
    if (unknown.length) {
      this.logger.error(
        `Valeur inconnue pour --only : ${unknown.join(', ')} (attendu : ${STEPS.join(', ')})`
      )
      this.exitCode = 1
      return undefined
    }
    return STEPS.filter((step) => requested.includes(step))
  }

  async #prepareDump(directory: string, dump: RebrickableDump) {
    if (this.skipDownload) {
      if (!(await dumpExists(directory, dump))) {
        throw new Error(`${dumpPath(directory, dump)} introuvable : relance sans --skip-download`)
      }
      this.logger.info(`${dump}.csv.gz : fichier existant réutilisé`)
      return
    }

    const action = this.logger.action(`Téléchargement de ${dump}.csv.gz`)
    try {
      await downloadDump(directory, dump)
      action.succeeded()
    } catch (error) {
      action.failed(error instanceof Error ? error : String(error))
      throw error
    }
  }

  #printSummary(results: Result[], aggregates?: AggregateStats) {
    const table = this.ui.table()
    table.head([
      'Données',
      'Lues',
      'Créées',
      'Mises à jour',
      'Inchangées',
      'Supprimées',
      'Ignorées',
      'Erreurs',
    ])
    for (const { label, stats } of results) {
      table.row([
        label,
        String(stats.read),
        String(stats.created),
        String(stats.updated),
        String(stats.unchanged),
        String(stats.deleted),
        String(stats.skipped),
        String(stats.errors),
      ])
    }
    table.render()

    if (aggregates) {
      this.logger.info(
        `Champs calculés mis à jour : ${aggregates.setsRecounted} sets (nombre de minifigs), ` +
          `${aggregates.minifigsRecomputed} minifigs (thème principal, première année)`
      )
    }
  }
}
