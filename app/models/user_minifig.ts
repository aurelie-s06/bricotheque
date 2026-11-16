import { UserMinifigSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Minifig from '#models/minifig'

/**
 * A minifig in a user's collection (status "owned") or wishlist (status "wanted").
 */
export default class UserMinifig extends UserMinifigSchema {
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Minifig)
  declare minifig: BelongsTo<typeof Minifig>
}
