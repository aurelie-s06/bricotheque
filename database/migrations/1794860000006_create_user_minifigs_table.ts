import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_minifigs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .integer('minifig_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('minifigs')
        .onDelete('CASCADE')
      table.enum('status', ['owned', 'wanted']).notNullable()
      table.smallint('quantity').unsigned().notNullable().defaultTo(1)
      table.text('note').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['user_id', 'minifig_id', 'status'])
      table.index(['minifig_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
