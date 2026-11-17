import db from '@adonisjs/lucid/services/db'
import ThemeTree from '#services/catalogue/theme_tree'
import { filtersToQuery, parseSetFilters } from '#services/catalogue/set_filters'
import { SETS_PER_PAGE, setCatalogueQuery } from '#services/catalogue/set_query'
import {
  MINIFIGS_PER_PAGE,
  minifigCatalogueQuery,
  minifigFiltersToQuery,
  parseMinifigFilters,
} from '#services/catalogue/minifig_query'
import BrickSetTransformer from '#transformers/brick_set_transformer'
import MinifigTransformer from '#transformers/minifig_transformer'
import type { CollectionStatus } from '#services/collection'

export const CONDITIONS = ['built', 'in_box', 'sealed', 'partial'] as const
type Condition = (typeof CONDITIONS)[number]

const pagination = (page: {
  currentPage: number
  lastPage: number
  total: number
  perPage: number
}) => ({
  currentPage: page.currentPage,
  lastPage: page.lastPage,
  total: page.total,
  perPage: page.perPage,
})

/**
 * Sets or minifigs of one user's collection or wishlist, with the same
 * filters as the catalogue (plus the condition of owned sets).
 */
export async function setsOfUser(
  userId: number,
  status: CollectionStatus,
  qs: Record<string, any>
) {
  // In a collection, books and gear count too: every type by default
  const filters = parseSetFilters({ type: 'all', ...qs })
  const condition = CONDITIONS.includes(qs.condition) ? (qs.condition as Condition) : null
  const themes = await ThemeTree.load()

  const query = setCatalogueQuery(filters, themes).whereIn('id', (sub) => {
    sub.from('user_sets').select('set_id').where({ user_id: userId, status })
    if (condition && status === 'owned') sub.where('condition', condition)
  })
  const page = await query.paginate(filters.page, SETS_PER_PAGE)

  const entryRows: { set_id: number; quantity: number; condition: Condition | null }[] = await db
    .from('user_sets')
    .where({ user_id: userId, status })
    .whereIn(
      'set_id',
      page.all().map((set) => set.id)
    )
    .select('set_id', 'quantity', 'condition')

  const counts = await themes.setCounts()
  // "all" is the default here: only an explicit other type goes in the URL
  const queryString = filtersToQuery(filters)
  delete queryString.type
  if (filters.type !== 'all') queryString.type = filters.type
  if (condition) queryString.condition = condition

  return {
    sets: BrickSetTransformer.transform(page.all()),
    pagination: pagination(page),
    query: queryString,
    themeOptions: themes.options(counts),
    entries: Object.fromEntries(
      entryRows.map((row) => [row.set_id, { quantity: row.quantity, condition: row.condition }])
    ),
  }
}

export async function minifigsOfUser(
  userId: number,
  status: CollectionStatus,
  qs: Record<string, any>
) {
  const filters = parseMinifigFilters(qs)
  const themes = await ThemeTree.load()
  const query = minifigCatalogueQuery(filters, themes).whereIn('id', (sub) => {
    sub.from('user_minifigs').select('minifig_id').where({ user_id: userId, status })
  })
  const page = await query.paginate(filters.page, MINIFIGS_PER_PAGE)

  const entryRows: { minifig_id: number; quantity: number }[] = await db
    .from('user_minifigs')
    .where({ user_id: userId, status })
    .whereIn(
      'minifig_id',
      page.all().map((minifig) => minifig.id)
    )
    .select('minifig_id', 'quantity')

  const counts = await themes.minifigCounts()
  return {
    minifigs: MinifigTransformer.transform(page.all()),
    pagination: pagination(page),
    query: minifigFiltersToQuery(filters),
    themeOptions: themes
      .roots()
      .filter((theme) => (counts.get(theme.id) ?? 0) > 0)
      .map((theme) => ({ slug: theme.slug, name: theme.name, depth: 0 })),
    entries: Object.fromEntries(
      entryRows.map((row) => [row.minifig_id, { quantity: row.quantity, condition: null }])
    ),
  }
}

/** Number of items (and copies) per tab */
export async function collectionCounts(userId: number, status: CollectionStatus) {
  const [sets, minifigs] = await Promise.all([
    db
      .from('user_sets')
      .where({ user_id: userId, status })
      .count('* as items')
      .sum('quantity as copies')
      .first(),
    db
      .from('user_minifigs')
      .where({ user_id: userId, status })
      .count('* as items')
      .sum('quantity as copies')
      .first(),
  ])
  return {
    sets: Number(sets?.items ?? 0),
    setCopies: Number(sets?.copies ?? 0),
    minifigs: Number(minifigs?.items ?? 0),
    minifigCopies: Number(minifigs?.copies ?? 0),
  }
}

/**
 * Estimated price of a wishlist: BrickLink value (new) when known,
 * otherwise the original price, times the wanted quantity.
 */
export async function wishlistTotal(userId: number) {
  const sets = await db
    .from('user_sets')
    .join('sets', 'sets.id', 'user_sets.set_id')
    .where({ 'user_sets.user_id': userId, 'user_sets.status': 'wanted' })
    .select(
      db.raw('SUM(COALESCE(sets.estimated_value_new, sets.rrp_eur) * user_sets.quantity) as total'),
      db.raw('SUM(COALESCE(sets.estimated_value_new, sets.rrp_eur) IS NULL) as unknown')
    )
    .first()
  const minifigs = await db
    .from('user_minifigs')
    .join('minifigs', 'minifigs.id', 'user_minifigs.minifig_id')
    .where({ 'user_minifigs.user_id': userId, 'user_minifigs.status': 'wanted' })
    .select(
      db.raw('SUM(minifigs.estimated_value_new * user_minifigs.quantity) as total'),
      db.raw('SUM(minifigs.estimated_value_new IS NULL) as unknown')
    )
    .first()
  return {
    total: Math.round((Number(sets?.total ?? 0) + Number(minifigs?.total ?? 0)) * 100) / 100,
    unknownPrices: Number(sets?.unknown ?? 0) + Number(minifigs?.unknown ?? 0),
  }
}
