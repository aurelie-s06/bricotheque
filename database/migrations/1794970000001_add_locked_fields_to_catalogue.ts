import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Fields corrected by hand in the back office ("name,year,rrp_eur"…):
 * the Rebrickable and Brickset imports leave them as they are.
 */
export default class extends BaseSchema {
  async up() {
    for (const table of ['sets', 'minifigs']) {
      this.schema.alterTable(table, (t) => {
        t.string('locked_fields', 255).nullable()
      })
    }
  }

  async down() {
    for (const table of ['sets', 'minifigs']) {
      this.schema.alterTable(table, (t) => {
        t.dropColumn('locked_fields')
      })
    }
  }
}
