import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('sets', (table) => {
      /** French machine translation of `description` (Brickset, English) */
      table.text('description_fr').nullable().after('description')
      /** SHA-1 of the English text that was translated: retranslate when it changes */
      table.string('description_fr_source_hash', 40).nullable().after('description_fr')
      table.timestamp('description_fr_translated_at').nullable().after('description_fr_source_hash')
    })

    // Translation runs are logged in import_runs too
    if (this.db.dialect.name === 'mysql') {
      this.defer(async (db) => {
        await db.rawQuery(
          "ALTER TABLE `import_runs` MODIFY `source` ENUM('rebrickable', 'brickset', 'bricklink', 'translation') NOT NULL"
        )
      })
    }
  }

  async down() {
    if (this.db.dialect.name === 'mysql') {
      this.defer(async (db) => {
        await db.from('import_runs').where('source', 'translation').delete()
        await db.rawQuery(
          "ALTER TABLE `import_runs` MODIFY `source` ENUM('rebrickable', 'brickset', 'bricklink') NOT NULL"
        )
      })
    }
    this.schema.alterTable('sets', (table) => {
      table.dropColumn('description_fr_translated_at')
      table.dropColumn('description_fr_source_hash')
      table.dropColumn('description_fr')
    })
  }
}
