import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Sets and minifigs added by hand in the back office. Their number gets a
 * suffix ("76999-1~m") so that the same item coming later from the imports
 * is a separate row, merged by an administrator.
 */
export default class extends BaseSchema {
  async up() {
    for (const table of ['sets', 'minifigs']) {
      this.schema.alterTable(table, (t) => {
        t.boolean('is_manual').notNullable().defaultTo(false)
      })
    }
  }

  async down() {
    for (const table of ['sets', 'minifigs']) {
      this.schema.alterTable(table, (t) => {
        t.dropColumn('is_manual')
      })
    }
  }
}
