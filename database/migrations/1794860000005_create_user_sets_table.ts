import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'user_sets'

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
        .integer('set_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('sets')
        .onDelete('CASCADE')
      table.enum('status', ['owned', 'wanted']).notNullable()
      table.smallint('quantity').unsigned().notNullable().defaultTo(1)
      table.enum('condition', ['built', 'in_box', 'sealed', 'partial']).nullable()
      table.decimal('purchase_price', 10, 2).nullable()
      table.date('purchase_date').nullable()
      table.text('note').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['user_id', 'set_id', 'status'])
      table.index(['set_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
