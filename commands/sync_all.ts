import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import SyncJob from '#services/jobs/sync_job'

/**
 * Full data update now (Rebrickable, then Brickset), e.g. from a nightly
 * cron. It shares the lock of the back office: it does nothing when an
 * update is already pending or running.
 */
export default class SyncAll extends BaseCommand {
  static commandName = 'sync:all'
  static description = 'Update all the data now (Rebrickable, then Brickset)'
  static options: CommandOptions = { startApp: true }

  async run() {
    const job = await SyncJob.enqueue(null)
    if (!job) {
      this.logger.warning('Une mise à jour est déjà en attente ou en cours : rien à faire')
      return
    }
    const claimed = await SyncJob.claim()
    if (!claimed) return
    const done = await SyncJob.run(claimed, (line) => this.logger.log(line))
    if (done.status === 'failed') {
      this.logger.error(done.error ?? 'Échec')
      this.exitCode = 1
      return
    }
    const { newSets = [], newMinifigs = [] } = done.result ?? {}
    this.logger.success(
      `Mise à jour terminée : ${newSets.length} nouveau(x) set(s), ${newMinifigs.length} nouvelle(s) minifig(s)`
    )
  }
}
