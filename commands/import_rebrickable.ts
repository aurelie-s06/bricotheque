import { isAbsolute } from 'node:path'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { trackImportRun } from '#services/import_run_tracker'
import RebrickableImporter, { type ImportStats } from '#services/rebrickable/rebrickable_importer'
import {
  downloadDump,
  dumpExists,
  dumpPath,
  type RebrickableDump,
} from '#services/rebrickable/dumps'

const STEPS = ['themes', 'sets'] as const
type Step = (typeof STEPS)[number]

/** How many warnings are printed before only counting them */
const MAX_PRINTED_WARNINGS = 20

export default class ImportRebrickable extends BaseCommand {
  static commandName = 'import:rebrickable'
  static description = 'Import the Rebrickable catalogue (themes, sets) from its CSV dumps'
  static help = [
    'Downloads the gzipped CSV files into tmp/rebrickable, then upserts them.',
    'Running it again updates existing rows and never creates duplicates.',
    '',
    '{{ binaryName }} import:rebrickable',
    '{{ binaryName }} import:rebrickable --skip-download',
    '{{ binaryName }} import:rebrickable --only=sets',
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

  async run() {
    const steps = this.#selectedSteps()
    if (!steps) {
      return
    }
    const directory = isAbsolute(this.dir) ? this.dir : this.app.makePath(this.dir)

    try {
      for (const step of steps) {
        await this.#prepareDump(directory, step)
      }

      const results: [Step, ImportStats][] = []
      for (const step of steps) {
        this.logger.info(`Import : ${step}`)
        const stats = await trackImportRun('rebrickable', step, () =>
          this.#importStep(step, dumpPath(directory, step))
        )
        results.push([step, stats])
      }

      this.#printSummary(results)
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error))
      this.exitCode = 1
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

  async #importStep(step: Step, path: string) {
    let warnings = 0
    const importer = new RebrickableImporter({
      onProgress: (read) => {
        if (read % 5000 < 500) {
          this.logger.log(this.colors.dim(`  ${read.toLocaleString('fr-FR')} lignes lues`))
        }
      },
      onWarning: (message) => {
        warnings++
        if (warnings <= MAX_PRINTED_WARNINGS) {
          this.logger.warning(message)
        } else if (warnings === MAX_PRINTED_WARNINGS + 1) {
          this.logger.warning('… avertissements suivants masqués (voir le résumé)')
        }
      },
    })

    return step === 'themes' ? importer.importThemes(path) : importer.importSets(path)
  }

  #printSummary(results: [Step, ImportStats][]) {
    const table = this.ui.table()
    table.head(['Données', 'Lues', 'Créées', 'Mises à jour', 'Inchangées', 'Ignorées', 'Erreurs'])
    for (const [step, stats] of results) {
      table.row([
        step,
        String(stats.read),
        String(stats.created),
        String(stats.updated),
        String(stats.unchanged),
        String(stats.skipped),
        String(stats.errors),
      ])
    }
    table.render()
  }
}
