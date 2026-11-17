import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      /** Set when the owner clicks the confirmation link sent at signup */
      table.timestamp('email_verified_at').nullable().after('email')
    })

    // Accounts created before the confirmation step are considered confirmed
    this.defer(async (db) => {
      await db.from(this.tableName).update({ email_verified_at: db.raw('created_at') })
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email_verified_at')
    })
  }
}
