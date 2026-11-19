import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { minifigPath, setPath } from '#helpers/urls'

const TOP = 10
const MONTHS = 12

const total = async (query: ReturnType<typeof db.from>) => {
  const [row] = await query.count('* as total')
  return Number(row.total)
}

/** Members with at least one set in their collection */
async function collectors() {
  const [row] = await db
    .from('user_sets')
    .where('status', 'owned')
    .countDistinct('user_id as total')
  return Number(row.total)
}

/** Sets most owned (or wanted): number of members, not quantities */
async function topSets(status: 'owned' | 'wanted') {
  const rows = await db
    .from('user_sets')
    .join('sets', 'sets.id', 'user_sets.set_id')
    .where('user_sets.status', status)
    .groupBy('sets.id', 'sets.set_num', 'sets.slug', 'sets.name')
    .select('sets.set_num', 'sets.slug', 'sets.name')
    .countDistinct('user_sets.user_id as members')
    .orderBy('members', 'desc')
    .orderBy('sets.set_num', 'asc')
    .limit(TOP)
  return rows.map((row) => ({
    number: String(row.set_num),
    name: String(row.name),
    url: setPath({ setNum: row.set_num, slug: row.slug }),
    value: Number(row.members),
  }))
}

async function topMinifigs(status: 'owned' | 'wanted') {
  const rows = await db
    .from('user_minifigs')
    .join('minifigs', 'minifigs.id', 'user_minifigs.minifig_id')
    .where('user_minifigs.status', status)
    .groupBy('minifigs.id', 'minifigs.fig_num', 'minifigs.slug', 'minifigs.name')
    .select('minifigs.fig_num', 'minifigs.slug', 'minifigs.name')
    .countDistinct('user_minifigs.user_id as members')
    .orderBy('members', 'desc')
    .orderBy('minifigs.fig_num', 'asc')
    .limit(TOP)
  return rows.map((row) => ({
    number: String(row.fig_num),
    name: String(row.name),
    url: minifigPath({ figNum: row.fig_num, slug: row.slug }),
    value: Number(row.members),
  }))
}

/** Sign-ups of the last 12 months, months without sign-up included */
async function signupsByMonth(today: DateTime) {
  const first = today.startOf('month').minus({ months: MONTHS - 1 })
  const rows: { month: string; total: number }[] = await db
    .from('users')
    .where('created_at', '>=', first.toFormat('yyyy-LL-dd HH:mm:ss'))
    .groupByRaw("DATE_FORMAT(`created_at`, '%Y-%m')")
    .select(db.raw("DATE_FORMAT(`created_at`, '%Y-%m') as month"))
    .count('* as total')
  const byMonth = new Map(rows.map((row) => [row.month, Number(row.total)]))
  return Array.from({ length: MONTHS }, (_, index) => {
    const month = first.plus({ months: index }).toFormat('yyyy-LL')
    return { month, value: byMonth.get(month) ?? 0 }
  })
}

/**
 * Back office: figures about the members and their collections.
 */
export default class StatsController {
  /** GET /admin/statistiques */
  async index({ inertia }: HttpContext) {
    const today = DateTime.now()
    const since30Days = today.minus({ days: 30 }).toFormat('yyyy-LL-dd HH:mm:ss')

    return inertia.render('admin/stats', {
      figures: {
        users: await total(db.from('users')),
        verified: await total(db.from('users').whereNotNull('email_verified_at')),
        newUsers: await total(db.from('users').where('created_at', '>=', since30Days)),
        collectors: await collectors(),
        setsOwned: await total(db.from('user_sets').where('status', 'owned')),
        setsWanted: await total(db.from('user_sets').where('status', 'wanted')),
        minifigsOwned: await total(db.from('user_minifigs').where('status', 'owned')),
        sharedWishlists: await total(db.from('users').whereNotNull('wishlist_share_token')),
      },
      signups: await signupsByMonth(today),
      top: {
        setsOwned: await topSets('owned'),
        setsWanted: await topSets('wanted'),
        minifigsOwned: await topMinifigs('owned'),
        minifigsWanted: await topMinifigs('wanted'),
      },
    })
  }
}
