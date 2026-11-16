import { UserSetSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import BrickSet from '#models/brick_set'

/**
 * A set in a user's collection (status "owned") or wishlist (status "wanted").
 */
export default class UserSet extends UserSetSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => BrickSet, { foreignKey: 'setId' })
  declare set: BelongsTo<typeof BrickSet>
}
