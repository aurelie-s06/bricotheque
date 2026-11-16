import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sets'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      /**
       * What the catalogue entry really is. Rebrickable lists books, gear
       * (key chains, bags…), parts packs and bundles as "sets": we keep
       * them, but the catalogue only shows real sets by default.
       */
      table
        .enum('kind', ['set', 'book', 'gear', 'parts', 'bundle'])
        .notNullable()
        .defaultTo('set')
        .after('theme_id')
      table.index(['kind'])
    })

    /**
     * Bulk upserts do not go through Lucid models: let MySQL bump
     * updated_at only when a row really changes.
     */
    if (this.db.dialect.name === 'mysql') {
      this.defer(async (db) => {
        await db.rawQuery(
          'ALTER TABLE `sets` MODIFY `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP'
        )
      })
    }
  }

  async down() {
    if (this.db.dialect.name === 'mysql') {
      this.defer(async (db) => {
        await db.rawQuery('ALTER TABLE `sets` MODIFY `updated_at` TIMESTAMP NULL DEFAULT NULL')
      })
    }

    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['kind'])
      table.dropColumn('kind')
    })
  }
}
