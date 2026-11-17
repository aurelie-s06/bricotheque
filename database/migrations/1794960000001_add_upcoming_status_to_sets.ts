import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * "upcoming": announced sets, not on sale yet (first availability date in
 * the future, or a future year without date). The Brickset import keeps
 * the status up to date afterwards.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(
        "ALTER TABLE `sets` MODIFY `availability_status` ENUM('upcoming', 'available', 'retired', 'unknown') NOT NULL DEFAULT 'unknown'"
      )
      await db.rawQuery(
        "UPDATE `sets` SET `availability_status` = 'upcoming' WHERE `date_first_available` > CURDATE() OR (`date_first_available` IS NULL AND `year` > YEAR(CURDATE()))"
      )
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(
        "UPDATE `sets` SET `availability_status` = 'unknown' WHERE `availability_status` = 'upcoming'"
      )
      await db.rawQuery(
        "ALTER TABLE `sets` MODIFY `availability_status` ENUM('available', 'retired', 'unknown') NOT NULL DEFAULT 'unknown'"
      )
    })
  }
}
