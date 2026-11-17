import { createHash } from 'node:crypto'
import { DateTime } from 'luxon'
import string from '@adonisjs/core/helpers/string'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'

/** A reset link is valid for one hour */
export const RESET_TOKEN_LIFETIME = { hours: 1 }

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
const sqlDate = (date: DateTime) => date.toUTC().toSQL({ includeOffset: false })!

/**
 * Single-use "forgot password" tokens. Only their SHA-256 is stored, so a
 * database leak does not give working links.
 */
export default class PasswordReset {
  /** Creates a token (replacing the previous ones of the user) and returns it */
  static async createToken(user: User) {
    const token = string.random(48)
    await db.transaction(async (trx) => {
      await trx.from('password_reset_tokens').where('user_id', user.id).delete()
      await trx.table('password_reset_tokens').insert({
        user_id: user.id,
        token_hash: hashToken(token),
        expires_at: sqlDate(DateTime.utc().plus(RESET_TOKEN_LIFETIME)),
        created_at: sqlDate(DateTime.utc()),
      })
    })
    return token
  }

  /** The user of a valid, unexpired token; null otherwise */
  static async findUser(token: string) {
    if (!token || token.length > 200) {
      return null
    }
    const row = await db
      .from('password_reset_tokens')
      .where('token_hash', hashToken(token))
      .where('expires_at', '>', sqlDate(DateTime.utc()))
      .first()
    return row ? User.find(row.user_id) : null
  }

  /** Invalidates every token of the user (after a successful reset) */
  static async consumeAll(user: User) {
    await db.from('password_reset_tokens').where('user_id', user.id).delete()
  }
}
