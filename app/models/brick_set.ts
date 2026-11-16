import { SetSchema } from '#database/schema'
import { belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Theme from '#models/theme'
import Minifig from '#models/minifig'
import UserSet from '#models/user_set'

/**
 * A set from the catalogue (table "sets"). Named BrickSet to avoid
 * shadowing the global JavaScript `Set`.
 */
export default class BrickSet extends SetSchema {
  static table = 'sets'

  @belongsTo(() => Theme, { foreignKey: 'themeId' })
  declare theme: BelongsTo<typeof Theme>

  /**
   * Minifigs included in the set, with their quantity
   * (available as `minifig.$extras.pivot_quantity`).
   */
  @manyToMany(() => Minifig, {
    pivotTable: 'set_minifigs',
    localKey: 'id',
    pivotForeignKey: 'set_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'minifig_id',
    pivotColumns: ['quantity'],
  })
  declare minifigs: ManyToMany<typeof Minifig>

  @hasMany(() => UserSet, { foreignKey: 'setId' })
  declare userSets: HasMany<typeof UserSet>
}
