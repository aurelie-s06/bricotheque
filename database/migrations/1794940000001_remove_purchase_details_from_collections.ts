import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The collection only keeps the quantity and the condition: purchase
 * price, purchase date and note are removed.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('user_sets', (table) => {
      table.dropColumn('purchase_price')
      table.dropColumn('purchase_date')
      table.dropColumn('note')
    })
    this.schema.alterTable('user_minifigs', (table) => {
      table.dropColumn('note')
    })
  }

  /** Puts the columns back (empty: the removed values are not restored) */
  async down() {
    this.schema.alterTable('user_sets', (table) => {
      table.decimal('purchase_price', 10, 2).nullable()
      table.date('purchase_date').nullable()
      table.text('note').nullable()
    })
    this.schema.alterTable('user_minifigs', (table) => {
      table.text('note').nullable()
    })
  }
}
