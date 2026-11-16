import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'minifigs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('fig_num', 32).notNullable().unique() // e.g. "fig-000123"
      table.string('name', 255).notNullable()
      table.string('slug', 255).notNullable()
      table.integer('num_parts').unsigned().notNullable().defaultTo(0)
      table.string('img_url', 512).nullable()

      // Computed from the sets that contain the minifig
      table
        .integer('main_theme_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('themes')
        .onDelete('SET NULL')
      table.smallint('year_first').unsigned().nullable()

      // Estimated values (BrickLink)
      table.decimal('estimated_value_new', 10, 2).nullable()
      table.decimal('estimated_value_used', 10, 2).nullable()
      table.string('estimated_value_currency', 3).nullable()
      table.timestamp('estimated_value_updated_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['main_theme_id'])
      if (this.db.dialect.name === 'mysql') {
        table.index(['name'], 'minifigs_name_fulltext', { indexType: 'FULLTEXT' })
      } else {
        table.index(['name'])
      }
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
