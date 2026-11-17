import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Back office: administrator role, manual pictures (never overwritten by
 * the imports) and the jobs table used to run the data updates in the
 * background (worker started by cron, no Redis needed).
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.boolean('is_admin').notNullable().defaultTo(false).after('email_verified_at')
    })

    for (const tableName of ['sets', 'minifigs']) {
      this.schema.alterTable(tableName, (table) => {
        /** Picture pasted by an administrator: shown instead of img_url */
        table.string('img_url_manual', 500).nullable().after('img_url')
        /** Set when an administrator's browser could not load the picture */
        table.timestamp('img_broken_at').nullable().after('img_url_manual')
      })
    }

    this.schema.createTable('jobs', (table) => {
      table.increments('id')
      table.enum('type', ['sync']).notNullable()
      table.enum('status', ['pending', 'running', 'completed', 'failed']).notNullable()
      table
        .integer('requested_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      /** { step, steps, label, message } */
      table.text('progress').nullable()
      /** { newSets: string[], newMinifigs: string[] } */
      table.text('result').nullable()
      table.text('error').nullable()
      table.timestamp('started_at').nullable()
      table.timestamp('heartbeat_at').nullable()
      table.timestamp('finished_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable('jobs')
    for (const tableName of ['sets', 'minifigs']) {
      this.schema.alterTable(tableName, (table) => {
        table.dropColumn('img_broken_at')
        table.dropColumn('img_url_manual')
      })
    }
    this.schema.alterTable('users', (table) => {
      table.dropColumn('is_admin')
    })
  }
}
