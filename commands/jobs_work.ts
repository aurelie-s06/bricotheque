import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import SyncJob from '#services/jobs/sync_job'
import SiteHealth from '#services/admin/site_health'
import ImageCheckJob from '#services/jobs/image_check_job'

/**
 * Runs the jobs asked for in the back office. Meant for cron, every minute:
 *   * * * * * cd ~/bricotheque && node ace jobs:work
 * It does nothing when no job is pending or when one is already running.
 */
export default class JobsWork extends BaseCommand {
  static commandName = 'jobs:work'
  static description = 'Run the pending background jobs (data updates asked in the back office)'
  static options: CommandOptions = { startApp: true }

  async run() {
    // Lets the back office check that the cron task really runs
    await SiteHealth.recordHeartbeat()
    let job = await SyncJob.claim()
    if (!job) {
      this.logger.info('Aucun job en attente')
      return
    }
    while (job) {
      if (job.type === 'images') {
        this.logger.info(`Job ${job.id} : vérification de toutes les images`)
        const done = await ImageCheckJob.run(job)
        if (done.status === 'failed') {
          this.logger.error(`Job ${done.id} en échec : ${done.error}`)
          this.exitCode = 1
        } else {
          this.logger.success(`Job ${done.id} terminé : ${done.progress?.message ?? ''}`)
        }
        job = await SyncJob.claim()
        continue
      }
      this.logger.info(`Job ${job.id} : mise à jour des données`)
      const done = await SyncJob.run(job, (line) => this.logger.log(line))
      if (done.status === 'failed') {
        this.logger.error(`Job ${done.id} en échec : ${done.error}`)
        this.exitCode = 1
      } else {
        this.logger.success(`Job ${done.id} terminé`)
      }
      job = await SyncJob.claim()
    }
  }
}
