import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import DbBackup, { KEEP_BACKUPS } from '#services/admin/db_backup'

/**
 * Backs up the whole database into storage/backups (the last 4 are kept).
 * Run once a week by `sync:all`; can also be run by hand at any time.
 */
export default class DbBackupCommand extends BaseCommand {
  static commandName = 'db:backup'
  static description = `Back up the database into storage/backups (keeps the last ${KEEP_BACKUPS})`
  static options: CommandOptions = { startApp: true }

  async run() {
    const file = await DbBackup.run()
    const size = (file.size / 1024 / 1024).toFixed(1)
    this.logger.success(`Sauvegarde : storage/backups/${file.name} (${size} Mo)`)
  }
}
