import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Additional pictures of a set (Brickset getAdditionalImages), fetched one
 * set at a time within the daily quota, and the number Brickset announces
 * for each set (free with getSets, so no call is wasted on sets without).
 */
export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('sets', (table) => {
      table.smallint('additional_image_count').unsigned().nullable().after('brickset_id')
      table.timestamp('additional_images_fetched_at').nullable().after('additional_image_count')
    })

    this.schema.createTable('set_images', (table) => {
      table.increments('id')
      table
        .integer('set_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('sets')
        .onDelete('CASCADE')
      table.smallint('position').unsigned().notNullable()
      table.string('image_url', 512).notNullable()
      table.string('thumbnail_url', 512).nullable()
      table.timestamp('created_at').notNullable()
      table.unique(['set_id', 'position'])
    })
  }

  async down() {
    this.schema.dropTable('set_images')
    this.schema.alterTable('sets', (table) => {
      table.dropColumn('additional_images_fetched_at')
      table.dropColumn('additional_image_count')
    })
  }
}
