import Minifig from '#models/minifig'
import type ThemeTree from '#services/catalogue/theme_tree'

export const MINIFIGS_PER_PAGE = 48

export const MINIFIG_SORTS = ['recent', 'oldest', 'name', 'number'] as const
export type MinifigSort = (typeof MINIFIG_SORTS)[number]

export type MinifigFilters = {
  q: string | null
  theme: string | null
  yearMin: number | null
  yearMax: number | null
  sort: MinifigSort | null
  page: number
}

type Query = Record<string, unknown>

function text(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().replace(/\s+/g, ' ').slice(0, 100)
  return trimmed || null
}

function integer(value: unknown, min: number, max: number) {
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return null
  const number = Number(value)
  return number >= min && number <= max ? number : null
}

/**
 * Minifig filters from the query string; invalid values are ignored.
 */
export function parseMinifigFilters(query: Query): MinifigFilters {
  let yearMin = integer(query.year_min, 1900, 2100)
  let yearMax = integer(query.year_max, 1900, 2100)
  if (yearMin !== null && yearMax !== null && yearMin > yearMax) {
    ;[yearMin, yearMax] = [yearMax, yearMin]
  }
  const sort =
    typeof query.sort === 'string' && (MINIFIG_SORTS as readonly string[]).includes(query.sort)
      ? (query.sort as MinifigSort)
      : null
  return {
    q: text(query.q),
    theme: text(query.theme),
    yearMin,
    yearMax,
    sort,
    page: integer(query.page, 1, 100_000) ?? 1,
  }
}

export function minifigFiltersToQuery(filters: MinifigFilters): Record<string, string> {
  const query: Record<string, string> = {}
  if (filters.q) query.q = filters.q
  if (filters.theme) query.theme = filters.theme
  if (filters.yearMin !== null) query.year_min = String(filters.yearMin)
  if (filters.yearMax !== null) query.year_max = String(filters.yearMax)
  if (filters.sort) query.sort = filters.sort
  return query
}

/**
 * "fig-000123", "000123" and "123" all mean fig-000123.
 */
export function figNumFromSearch(q: string): string | null {
  const match = /^(?:fig-?)?(\d{1,6})$/i.exec(q.trim())
  return match ? `fig-${match[1].padStart(6, '0')}` : null
}

function likeEscape(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`)
}

/**
 * Builds the minifig catalogue query from the filters.
 */
export function minifigCatalogueQuery(filters: MinifigFilters, themes: ThemeTree) {
  const query = Minifig.query()
  const figNum = filters.q ? figNumFromSearch(filters.q) : null

  if (filters.q) {
    const q = filters.q
    query.where((search) => {
      // Raw LIKE with bindings (case and accent insensitive, see set_query.ts)
      search.where((byName) => {
        for (const word of q.split(' ')) {
          byName.whereRaw('`name` LIKE ?', [`%${likeEscape(word)}%`])
        }
      })
      if (figNum) {
        search.orWhere('fig_num', figNum)
      }
    })
  }

  if (filters.theme) {
    const theme = themes.bySlug.get(filters.theme)
    query.whereIn('main_theme_id', theme ? themes.descendantIds(theme.id) : [])
  }
  if (filters.yearMin !== null) query.where('year_first', '>=', filters.yearMin)
  if (filters.yearMax !== null) query.where('year_first', '<=', filters.yearMax)

  if (!filters.sort && figNum) {
    query.orderByRaw('(`fig_num` = ?) DESC', [figNum])
  }
  switch (filters.sort ?? 'recent') {
    case 'recent':
      query.orderByRaw('`year_first` IS NULL').orderBy('year_first', 'desc')
      break
    case 'oldest':
      query.orderByRaw('`year_first` IS NULL').orderBy('year_first', 'asc')
      break
    case 'name':
      query.orderBy('name', 'asc')
      break
    case 'number':
      break
  }
  return query.orderBy('fig_num', 'asc')
}
