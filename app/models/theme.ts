import { ThemeSchema } from '#database/schema'
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import BrickSet from '#models/brick_set'
import Minifig from '#models/minifig'

/**
 * A Rebrickable theme. Themes are nested (e.g. "Star Wars" > "Episode IV-VI").
 * The id comes from Rebrickable, so it is assigned by us, not by MySQL.
 */
export default class Theme extends ThemeSchema {
  static selfAssignPrimaryKey = true

  @belongsTo(() => Theme, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof Theme>

  @hasMany(() => Theme, { foreignKey: 'parentId' })
  declare children: HasMany<typeof Theme>

  @hasMany(() => BrickSet, { foreignKey: 'themeId' })
  declare sets: HasMany<typeof BrickSet>

  @hasMany(() => Minifig, { foreignKey: 'mainThemeId' })
  declare minifigs: HasMany<typeof Minifig>
}
