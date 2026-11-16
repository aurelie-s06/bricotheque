import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'set_minifigs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .integer('set_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('sets')
        .onDelete('CASCADE')
      table
        .integer('minifig_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('minifigs')
        .onDelete('CASCADE')
      table.smallint('quantity').unsigned().notNullable().defaultTo(1)

      table.primary(['set_id', 'minifig_id'])
      table.index(['minifig_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
