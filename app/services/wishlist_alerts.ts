import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'
import env from '#start/env'
import User from '#models/user'
import { WishlistAlertMail, type AlertedSet } from '#mails/account_mails'
import { isLocale } from '#helpers/locale'
import { setPath } from '#helpers/urls'

/** A set "comes out" when its first day on sale is within this delay */
export const RELEASED_WITHIN = { days: 30 }
/** A set "leaves the shops soon" when its last day on sale is within this delay */
export const RETIRING_WITHIN = { days: 30 }

const UNSUBSCRIBE_PURPOSE = 'wishlist-alerts-unsubscribe'

type Row = {
  set_id: number
  set_num: string
  slug: string
  name: string
  first_day: string | null
  last_day: string | null
}

/**
 * Emails about the wishlist, after the nightly update: a set came out, or
 * leaves the shops soon. One email per member, each set alerted only once.
 */
export default class WishlistAlerts {
  static unsubscribeUrl(user: User) {
    const path = signedUrlFor(
      'wishlist_alerts.unsubscribe',
      { id: user.id },
      { purpose: UNSUBSCRIBE_PURPOSE }
    )
    return `${env.get('APP_URL').replace(/\/$/, '')}${path}`
  }

  static isValidUnsubscribe(request: { hasValidSignature(purpose?: string): boolean }) {
    return request.hasValidSignature(UNSUBSCRIBE_PURPOSE)
  }

  /** Sets of the wishlist to announce, not announced yet */
  static async pending(userId: number, today: DateTime) {
    const base = () =>
      db
        .from('user_sets')
        .join('sets', 'sets.id', 'user_sets.set_id')
        .where({ 'user_sets.user_id': userId, 'user_sets.status': 'wanted' })
        .select(
          'sets.id as set_id',
          'sets.set_num',
          'sets.slug',
          'sets.name',
          db.raw("DATE_FORMAT(sets.date_first_available, '%Y-%m-%d') as first_day"),
          db.raw("DATE_FORMAT(sets.date_last_available, '%Y-%m-%d') as last_day")
        )
    const notSent = (kind: 'released' | 'retiring') => (query: any) =>
      query.whereNotIn(
        'sets.id',
        db.from('wishlist_alerts_sent').where({ user_id: userId, kind }).select('set_id')
      )

    const day = today.toISODate()!
    const released: Row[] = await base()
      .where('sets.availability_status', 'available')
      .whereBetween('sets.date_first_available', [today.minus(RELEASED_WITHIN).toISODate()!, day])
      .where(notSent('released'))
      .orderBy('sets.date_first_available', 'desc')
    const retiring: Row[] = await base()
      .where('sets.availability_status', 'available')
      .whereBetween('sets.date_last_available', [day, today.plus(RETIRING_WITHIN).toISODate()!])
      .where(notSent('retiring'))
      .orderBy('sets.date_last_available', 'asc')
    return { released, retiring }
  }

  /** Sends the alerts of every member who asked for them. Returns the number of emails. */
  static async run(today = DateTime.utc()) {
    const users = await User.query()
      .where('wishlist_alerts', true)
      .whereNotNull('email_verified_at')
    let sent = 0
    for (const user of users) {
      const { released, retiring } = await this.pending(user.id, today)
      if (released.length === 0 && retiring.length === 0) continue

      const toAlert = (row: Row, date: string | null): AlertedSet => ({
        setNum: row.set_num,
        name: row.name,
        url: `${env.get('APP_URL').replace(/\/$/, '')}${setPath({ setNum: row.set_num, slug: row.slug })}`,
        date,
      })
      const locale = isLocale(user.locale) ? user.locale : 'fr'
      await mail.send(
        new WishlistAlertMail(user, locale, {
          released: released.map((row) => toAlert(row, row.first_day)),
          retiring: retiring.map((row) => toAlert(row, row.last_day)),
          wishlistUrl: `${env.get('APP_URL').replace(/\/$/, '')}/ma-wishlist`,
          unsubscribeUrl: this.unsubscribeUrl(user),
        })
      )
      const now = new Date()
      await db.table('wishlist_alerts_sent').insert([
        ...released.map((row) => ({
          user_id: user.id,
          set_id: row.set_id,
          kind: 'released',
          created_at: now,
        })),
        ...retiring.map((row) => ({
          user_id: user.id,
          set_id: row.set_id,
          kind: 'retiring',
          created_at: now,
        })),
      ])
      sent++
    }
    return sent
  }
}
