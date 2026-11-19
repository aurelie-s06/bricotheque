import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Pictures checked by the server (nightly, or all at once from the back
 * office): date of the last check, and a new kind of background job.
 */
export default class extends BaseSchema {
  async up() {
    for (const table of ['sets', 'minifigs']) {
      this.schema.alterTable(table, (t) => {
        t.timestamp('img_checked_at').nullable().after('img_broken_at')
        t.index(['img_checked_at'])
      })
    }
    this.defer(async (db) => {
      await db.rawQuery(
        "ALTER TABLE `jobs` MODIFY `type` ENUM('sync', 'images') NOT NULL DEFAULT 'sync'"
      )
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery("DELETE FROM `jobs` WHERE `type` = 'images'")
      await db.rawQuery("ALTER TABLE `jobs` MODIFY `type` ENUM('sync') NOT NULL DEFAULT 'sync'")
    })
    for (const table of ['sets', 'minifigs']) {
      this.schema.alterTable(table, (t) => {
        t.dropIndex(['img_checked_at'])
        t.dropColumn('img_checked_at')
      })
    }
  }
}
