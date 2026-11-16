import { MinifigSchema } from '#database/schema'
import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Theme from '#models/theme'
import BrickSet from '#models/brick_set'
import UserMinifig from '#models/user_minifig'

export default class Minifig extends MinifigSchema {
  /**
   * Most frequent theme among the sets that contain this minifig.
   */
  @belongsTo(() => Theme, { foreignKey: 'mainThemeId' })
  declare mainTheme: BelongsTo<typeof Theme>

  /**
   * Sets that contain this minifig, with the quantity per set
   * (available as `set.$extras.pivot_quantity`).
   */
  @manyToMany(() => BrickSet, {
    pivotTable: 'set_minifigs',
    localKey: 'id',
    pivotForeignKey: 'minifig_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'set_id',
    pivotColumns: ['quantity'],
  })
  declare sets: ManyToMany<typeof BrickSet>

  @hasMany(() => UserMinifig, { foreignKey: 'minifigId' })
  declare userMinifigs: HasMany<typeof UserMinifig>
}
