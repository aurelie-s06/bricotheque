import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      /** Add the minifigs of a set to the collection when the set is added */
      table
        .boolean('auto_add_minifigs')
        .notNullable()
        .defaultTo(false)
        .after('wishlist_share_token')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('auto_add_minifigs')
    })
  }
}
