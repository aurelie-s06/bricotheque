import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import SyncJob from '#services/jobs/sync_job'
import WishlistAlerts from '#services/wishlist_alerts'
import ImageHealth, { NIGHTLY_LIMIT } from '#services/admin/image_health'
import DbBackup from '#services/admin/db_backup'
import SetGallery from '#services/brickset/set_gallery'

/**
 * Full data update now (Rebrickable, then Brickset), e.g. from a nightly
 * cron, after the weekly backup of the database, then the wishlist alerts
 * and a batch of picture checks. It shares the lock of the back office: it does nothing when an
 * update is already pending or running.
 */
export default class SyncAll extends BaseCommand {
  static commandName = 'sync:all'
  static description = 'Update all the data now (Rebrickable, then Brickset)'
  static options: CommandOptions = { startApp: true }

  async run() {
    // Once a week, a backup of the database first (before anything changes)
    try {
      if (await DbBackup.isDue()) {
        const backup = await DbBackup.run()
        this.logger.success(`Sauvegarde de la base : storage/backups/${backup.name}`)
      }
    } catch (error) {
      this.logger.error(`Sauvegarde de la base en échec : ${(error as Error).message}`)
      this.exitCode = 1
    }

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

    // With fresh dates: the wishlist alerts of the day
    try {
      const sent = await WishlistAlerts.run()
      this.logger.success(`Alertes wishlist : ${sent} e-mail(s) envoyé(s)`)
    } catch (error) {
      this.logger.error(`Alertes wishlist en échec : ${(error as Error).message}`)
      this.exitCode = 1
    }

    // A batch of pictures: all are checked within a few nights, then monthly
    try {
      const stats = await ImageHealth.run({ limit: NIGHTLY_LIMIT })
      this.logger.success(
        `Images : ${stats.checked} vérifiée(s), ${stats.broken} cassée(s), ${stats.unknown} sans réponse`
      )
    } catch (error) {
      this.logger.error(`Vérification des images en échec : ${(error as Error).message}`)
      this.exitCode = 1
    }

    // Additional pictures of the most collected sets, with the quota kept for them
    try {
      const fetched = await SetGallery.prefetch((message) => this.logger.warning(message))
      this.logger.success(`Photos supplémentaires : ${fetched} set(s) mis à jour`)
    } catch (error) {
      this.logger.error(`Photos supplémentaires en échec : ${(error as Error).message}`)
      this.exitCode = 1
    }
  }
}
