import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Email alerts about the wishlist (a set comes out, or leaves the shops
 * soon). Off by default: the member turns them on. Each alert is sent once
 * per set (wishlist_alerts_sent).
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.boolean('wishlist_alerts').notNullable().defaultTo(false)
      table.boolean('wishlist_alerts_prompt_answered').notNullable().defaultTo(false)
      // Language of the emails sent without a visit (alerts): the last one used
      table.string('locale', 2).nullable()
    })

    this.schema.createTable('wishlist_alerts_sent', (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().references('users.id').onDelete('CASCADE')
      table.integer('set_id').unsigned().notNullable().references('sets.id').onDelete('CASCADE')
      table.enum('kind', ['released', 'retiring']).notNullable()
      table.timestamp('created_at').notNullable()
      table.unique(['user_id', 'set_id', 'kind'])
    })
  }

  async down() {
    this.schema.dropTable('wishlist_alerts_sent')
    this.schema.alterTable('users', (table) => {
      table.dropColumn('wishlist_alerts')
      table.dropColumn('wishlist_alerts_prompt_answered')
      table.dropColumn('locale')
    })
  }
}
