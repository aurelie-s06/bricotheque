import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import UserSet from '#models/user_set'
import UserMinifig from '#models/user_minifig'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  /**
   * Sets in the collection and wishlist (filter on `status`).
   */
  @hasMany(() => UserSet)
  declare userSets: HasMany<typeof UserSet>

  /**
   * Minifigs in the collection and wishlist (filter on `status`).
   */
  @hasMany(() => UserMinifig)
  declare userMinifigs: HasMany<typeof UserMinifig>
}
