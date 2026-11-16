import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Identity (Rebrickable)
      table.string('set_num', 32).notNullable().unique() // e.g. "75192-1"
      table.string('number', 32).notNullable() // e.g. "75192"
      table.smallint('variant').unsigned().notNullable().defaultTo(1)
      table.string('name', 255).notNullable()
      table.string('slug', 255).notNullable()
      table.smallint('year').unsigned().nullable()
      table.integer('theme_id').unsigned().notNullable().references('id').inTable('themes')
      table.integer('num_parts').unsigned().notNullable().defaultTo(0)
      table.smallint('num_minifigs').unsigned().notNullable().defaultTo(0)
      table.string('img_url', 512).nullable()

      // Prices (Brickset, LEGO.com retail prices)
      table.decimal('rrp_eur', 10, 2).nullable()
      table.decimal('rrp_usd', 10, 2).nullable()
      table.decimal('rrp_gbp', 10, 2).nullable()

      // Estimated values (BrickLink)
      table.decimal('estimated_value_new', 10, 2).nullable()
      table.decimal('estimated_value_used', 10, 2).nullable()
      table.string('estimated_value_currency', 3).nullable()
      table.timestamp('estimated_value_updated_at').nullable()

      // Availability (Brickset)
      table.date('date_first_available').nullable()
      table.date('date_last_available').nullable()
      table
        .enum('availability_status', ['available', 'retired', 'unknown'])
        .notNullable()
        .defaultTo('unknown')
      table.text('description').nullable()
      table.string('subtheme', 255).nullable()
      table.integer('brickset_id').unsigned().nullable().unique()
      table.timestamp('brickset_synced_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['number'])
      table.index(['theme_id'])
      table.index(['year'])
      table.index(['availability_status'])
      if (this.db.dialect.name === 'mysql') {
        table.index(['name'], 'sets_name_fulltext', { indexType: 'FULLTEXT' })
      } else {
        table.index(['name'])
      }
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
