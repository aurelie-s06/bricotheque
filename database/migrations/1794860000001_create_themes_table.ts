import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'themes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Rebrickable theme id (not auto-incremented)
      table.integer('id').unsigned().primary()
      table.string('name', 255).notNullable()
      table.string('slug', 255).notNullable().unique()
      table
        .integer('parent_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('themes')
        .onDelete('SET NULL')
      table.index(['parent_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
