import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import BrickSet from '#models/brick_set'
import ThemeTree from '#services/catalogue/theme_tree'
import { themePath } from '#helpers/urls'

/** Themes shown in the chart; the rest is grouped in "Others" */
export const THEMES_IN_CHART = 8
/** A wishlist set is "soon retired" when it leaves the shops within this delay */
export const RETIRING_SOON = { months: 6 }

type OwnedSetRow = {
  set_id: number
  quantity: number
  year: number | null
  theme_id: number
  num_parts: number
}

/** 1987 → 1980 */
export const decadeOf = (year: number) => Math.floor(year / 10) * 10

export default class Dashboard {
  constructor(private userId: number) {}

  async build(today = DateTime.utc()) {
    const owned: OwnedSetRow[] = await db
      .from('user_sets')
      .join('sets', 'sets.id', 'user_sets.set_id')
      .where({ 'user_sets.user_id': this.userId, 'user_sets.status': 'owned' })
      .select(
        'user_sets.set_id',
        'user_sets.quantity',
        'sets.year',
        'sets.theme_id',
        'sets.num_parts'
      )

    const minifigs: { quantity: number }[] = await db
      .from('user_minifigs')
      .where({ user_id: this.userId, status: 'owned' })
      .select('quantity')

    return {
      figures: this.#figures(owned, minifigs),
      byTheme: await this.#byTheme(owned),
      byDecade: this.#byDecade(owned),
      ...(await this.#topSets(owned)),
      wishlist: await this.#wishlistAlerts(today),
    }
  }

  #figures(owned: OwnedSetRow[], minifigs: { quantity: number }[]) {
    return {
      sets: owned.length,
      setCopies: owned.reduce((total, row) => total + row.quantity, 0),
      minifigs: minifigs.length,
      minifigCopies: minifigs.reduce((total, row) => total + row.quantity, 0),
      pieces: owned.reduce((total, row) => total + row.num_parts * row.quantity, 0),
    }
  }

  /** Owned sets per root theme, most represented first */
  async #byTheme(owned: OwnedSetRow[]) {
    const themes = await ThemeTree.load()
    const counts = new Map<number, number>()
    for (const row of owned) {
      const root = themes.ancestorsOf(row.theme_id)[0]
      if (root) counts.set(root.id, (counts.get(root.id) ?? 0) + 1)
    }
    const sorted = [...counts.entries()]
      .map(([id, count]) => ({ theme: themes.byId.get(id)!, count }))
      .sort((a, b) => b.count - a.count || a.theme.name.localeCompare(b.theme.name))

    const shown = sorted.slice(0, THEMES_IN_CHART).map(({ theme, count }) => ({
      name: theme.name,
      url: themePath(theme) as string | null,
      count,
    }))
    const others = sorted.slice(THEMES_IN_CHART).reduce((total, entry) => total + entry.count, 0)
    if (others > 0) shown.push({ name: '', url: null, count: others }) // "Others", named by the page
    return shown
  }

  /** Owned sets per decade, in chronological order (empty decades included) */
  #byDecade(owned: OwnedSetRow[]) {
    const counts = new Map<number, number>()
    for (const row of owned) {
      if (row.year) counts.set(decadeOf(row.year), (counts.get(decadeOf(row.year)) ?? 0) + 1)
    }
    if (counts.size === 0) return []
    const decades = [...counts.keys()]
    const result = []
    for (let decade = Math.min(...decades); decade <= Math.max(...decades); decade += 10) {
      result.push({ decade, count: counts.get(decade) ?? 0 })
    }
    return result
  }

  async #topSets(owned: OwnedSetRow[]) {
    const ids = owned.map((row) => row.set_id)
    if (ids.length === 0) return { biggest: [], oldest: [] }
    const biggest = await BrickSet.query()
      .whereIn('id', ids)
      .orderBy('num_parts', 'desc')
      .orderBy('set_num', 'asc')
      .limit(5)
    const oldest = await BrickSet.query()
      .whereIn('id', ids)
      .orderByRaw('`year` IS NULL')
      .orderBy('year', 'asc')
      .orderBy('set_num', 'asc')
      .limit(5)
    return { biggest, oldest }
  }

  /**
   * Wishlist sets to buy before it is too late: leaving the shops within
   * 6 months, or already retired.
   */
  async #wishlistAlerts(today: DateTime) {
    const wantedIds = db
      .from('user_sets')
      .select('set_id')
      .where({ user_id: this.userId, status: 'wanted' })

    const retiringSoon = await BrickSet.query()
      .whereIn('id', wantedIds)
      .where('availability_status', 'available')
      .whereNotNull('date_last_available')
      .where('date_last_available', '<=', today.plus(RETIRING_SOON).toISODate()!)
      .orderBy('date_last_available', 'asc')
    const retired = await BrickSet.query()
      .whereIn('id', wantedIds)
      .where('availability_status', 'retired')
      .orderByRaw('`date_last_available` IS NULL')
      .orderBy('date_last_available', 'desc')
      .orderBy('year', 'desc')
    return { retiringSoon, retired }
  }
}
