import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Bulk upserts of minifigs do not go through Lucid models: let MySQL bump
 * updated_at only when a row really changes (same as for sets).
 */
export default class extends BaseSchema {
  async up() {
    if (this.db.dialect.name === 'mysql') {
      this.defer(async (db) => {
        await db.rawQuery(
          'ALTER TABLE `minifigs` MODIFY `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP'
        )
      })
    }
  }

  async down() {
    if (this.db.dialect.name === 'mysql') {
      this.defer(async (db) => {
        await db.rawQuery('ALTER TABLE `minifigs` MODIFY `updated_at` TIMESTAMP NULL DEFAULT NULL')
      })
    }
  }
}
