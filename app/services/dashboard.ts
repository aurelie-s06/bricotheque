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
  condition: string | null
  purchase_price: string | null
  year: number | null
  theme_id: number
  num_parts: number
  rrp_eur: string | null
  estimated_value_new: string | null
  estimated_value_used: string | null
}

const num = (value: string | number | null | undefined) =>
  value === null || value === undefined ? null : Number(value)

/**
 * Estimated value of one owned set: BrickLink value (new for sealed sets,
 * otherwise used, otherwise new), or else the original price.
 */
export function setValue(
  row: Pick<OwnedSetRow, 'condition' | 'rrp_eur' | 'estimated_value_new' | 'estimated_value_used'>
) {
  const newValue = num(row.estimated_value_new)
  const usedValue = num(row.estimated_value_used)
  const bricklink = row.condition === 'sealed' ? newValue : (usedValue ?? newValue)
  if (bricklink !== null) return { value: bricklink, source: 'bricklink' as const }
  const original = num(row.rrp_eur)
  if (original !== null) return { value: original, source: 'original' as const }
  return { value: null, source: 'unknown' as const }
}

/** 1987 → 1980 */
export const decadeOf = (year: number) => Math.floor(year / 10) * 10

const round = (value: number) => Math.round(value * 100) / 100

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
        'user_sets.condition',
        'user_sets.purchase_price',
        'sets.year',
        'sets.theme_id',
        'sets.num_parts',
        'sets.rrp_eur',
        'sets.estimated_value_new',
        'sets.estimated_value_used'
      )

    const minifigs = await db
      .from('user_minifigs')
      .join('minifigs', 'minifigs.id', 'user_minifigs.minifig_id')
      .where({ 'user_minifigs.user_id': this.userId, 'user_minifigs.status': 'owned' })
      .select(
        'user_minifigs.quantity',
        'minifigs.estimated_value_new',
        'minifigs.estimated_value_used'
      )

    return {
      figures: this.#figures(owned, minifigs),
      byTheme: await this.#byTheme(owned),
      byDecade: this.#byDecade(owned),
      ...(await this.#topSets(owned)),
      wishlist: await this.#wishlistAlerts(today),
    }
  }

  #figures(
    owned: OwnedSetRow[],
    minifigs: {
      quantity: number
      estimated_value_new: string | null
      estimated_value_used: string | null
    }[]
  ) {
    let pieces = 0
    let paid = 0
    let withoutPrice = 0
    let value = 0
    const sources = { bricklink: 0, original: 0, unknown: 0 }

    for (const row of owned) {
      pieces += row.num_parts * row.quantity
      const price = num(row.purchase_price)
      if (price === null) withoutPrice++
      else paid += price * row.quantity
      const estimate = setValue(row)
      sources[estimate.source]++
      if (estimate.value !== null) value += estimate.value * row.quantity
    }
    for (const row of minifigs) {
      const estimate = num(row.estimated_value_used) ?? num(row.estimated_value_new)
      if (estimate !== null) value += estimate * row.quantity
    }

    return {
      sets: owned.length,
      setCopies: owned.reduce((total, row) => total + row.quantity, 0),
      minifigs: minifigs.length,
      minifigCopies: minifigs.reduce((total, row) => total + row.quantity, 0),
      pieces,
      paid: round(paid),
      setsWithoutPrice: withoutPrice,
      value: round(value),
      valueSources: sources,
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
