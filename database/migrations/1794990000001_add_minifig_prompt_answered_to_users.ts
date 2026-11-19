import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * After the first set in the collection, the site asks once whether the
 * minifigs of the sets should be added too. Set once the member answered
 * (or chose in the account preferences).
 */
export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('minifig_prompt_answered').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('minifig_prompt_answered')
    })
  }
}
