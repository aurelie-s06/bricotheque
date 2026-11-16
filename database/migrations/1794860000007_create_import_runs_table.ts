import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'import_runs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.enum('source', ['rebrickable', 'brickset', 'bricklink']).notNullable()
      table.string('type', 50).notNullable() // e.g. "sets", "minifigs", "prices"
      table
        .enum('status', ['running', 'completed', 'failed', 'interrupted'])
        .notNullable()
        .defaultTo('running')
      table.json('cursor').nullable() // where to resume (theme/year/page…)
      table.json('stats').nullable() // created/updated/skipped/errors counters
      table.timestamp('started_at').notNullable()
      table.timestamp('finished_at').nullable()
      table.text('error').nullable()

      table.index(['source', 'type', 'status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
