import BrickSet from '#models/brick_set'
import type ThemeTree from '#services/catalogue/theme_tree'
import type { SetFilters } from '#services/catalogue/set_filters'

export const SETS_PER_PAGE = 48

/** Escapes % and _ for a LIKE pattern */
function likeEscape(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`)
}

/**
 * A search that looks like a set number ("75192", "75192-1", "10179")
 * also matches the number itself.
 */
function looksLikeSetNumber(q: string) {
  return /^[\w.]+(-\d+)?$/.test(q) && /\d/.test(q)
}

/**
 * Builds the catalogue query from the filters.
 * Unknown theme slugs return no result rather than ignoring the filter.
 */
export function setCatalogueQuery(filters: SetFilters, themes: ThemeTree) {
  const query = BrickSet.query()

  if (filters.type !== 'all') {
    query.where('kind', filters.type)
  }

  if (filters.q) {
    const q = filters.q
    // Raw LIKE with bindings: Lucid's like helpers add `COLLATE utf8_bin`,
    // invalid with utf8mb4. The column collation (utf8mb4_unicode_ci) makes
    // the search case and accent insensitive.
    query.where((search) => {
      // every word must appear in the name
      search.where((byName) => {
        for (const word of q.split(' ')) {
          byName.whereRaw('`name` LIKE ?', [`%${likeEscape(word)}%`])
        }
      })
      if (looksLikeSetNumber(q)) {
        search
          .orWhere('number', q)
          .orWhere('set_num', q)
          .orWhereRaw('`set_num` LIKE ?', [`${likeEscape(q)}-%`])
      }
    })
  }

  if (filters.theme) {
    const theme = themes.bySlug.get(filters.theme)
    query.whereIn('theme_id', theme ? themes.descendantIds(theme.id) : [])
  }

  if (filters.yearMin !== null) query.where('year', '>=', filters.yearMin)
  if (filters.yearMax !== null) query.where('year', '<=', filters.yearMax)
  if (filters.partsMin !== null) query.where('num_parts', '>=', filters.partsMin)
  if (filters.partsMax !== null) query.where('num_parts', '<=', filters.partsMax)
  if (filters.priceMin !== null) query.where('rrp_eur', '>=', filters.priceMin)
  if (filters.priceMax !== null) query.where('rrp_eur', '<=', filters.priceMax)
  if (filters.status) query.where('availability_status', filters.status)

  applySort(query, filters)
  return query
}

function applySort(query: ReturnType<typeof BrickSet.query>, filters: SetFilters) {
  const naturalNumber = () =>
    query.orderByRaw('LENGTH(`number`) ASC').orderBy('number', 'asc').orderBy('variant', 'asc')

  // Searching without an explicit sort: exact set numbers first
  if (!filters.sort && filters.q && looksLikeSetNumber(filters.q)) {
    query.orderByRaw('(`number` = ? OR `set_num` = ?) DESC', [filters.q, filters.q])
  }

  switch (filters.sort ?? 'recent') {
    case 'recent':
      query.orderByRaw('`year` IS NULL').orderBy('year', 'desc')
      return naturalNumber()
    case 'oldest':
      query.orderByRaw('`year` IS NULL').orderBy('year', 'asc')
      return naturalNumber()
    case 'name':
      return query.orderBy('name', 'asc').orderBy('set_num', 'asc')
    case 'parts_desc':
      return query.orderBy('num_parts', 'desc').orderBy('set_num', 'asc')
    case 'parts_asc':
      return query.orderBy('num_parts', 'asc').orderBy('set_num', 'asc')
    case 'price_asc':
      return query
        .orderByRaw('`rrp_eur` IS NULL')
        .orderBy('rrp_eur', 'asc')
        .orderBy('set_num', 'asc')
    case 'price_desc':
      return query
        .orderByRaw('`rrp_eur` IS NULL')
        .orderBy('rrp_eur', 'desc')
        .orderBy('set_num', 'asc')
  }
}
