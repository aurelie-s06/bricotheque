/**
 * Catalogue filters, read from the query string. The URL is the state
 * (shareable links), so invalid values are ignored rather than rejected.
 */
export const SET_SORTS = [
  'recent',
  'oldest',
  'name',
  'parts_desc',
  'parts_asc',
  'price_asc',
  'price_desc',
] as const
export type SetSort = (typeof SET_SORTS)[number]

export const SET_STATUSES = ['available', 'retired', 'unknown'] as const
export type SetStatus = (typeof SET_STATUSES)[number]

export const SET_TYPES = ['set', 'book', 'gear', 'parts', 'bundle', 'all'] as const
export type SetType = (typeof SET_TYPES)[number]

export type SetFilters = {
  q: string | null
  theme: string | null
  yearMin: number | null
  yearMax: number | null
  partsMin: number | null
  partsMax: number | null
  priceMin: number | null
  priceMax: number | null
  status: SetStatus | null
  type: SetType
  /** null = default order (relevance when searching, otherwise most recent) */
  sort: SetSort | null
  page: number
}

type Query = Record<string, unknown>

function text(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim().replace(/\s+/g, ' ').slice(0, maxLength)
  return trimmed || null
}

function integer(value: unknown, min: number, max: number) {
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) {
    return null
  }
  const number = Number(value)
  return number >= min && number <= max ? number : null
}

function decimal(value: unknown, min: number, max: number) {
  if (typeof value !== 'string') {
    return null
  }
  const number = Number(value.trim().replace(',', '.'))
  return value.trim() !== '' && Number.isFinite(number) && number >= min && number <= max
    ? number
    : null
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null
}

/**
 * min/max given in the wrong order are swapped.
 */
function range(min: number | null, max: number | null): [number | null, number | null] {
  return min !== null && max !== null && min > max ? [max, min] : [min, max]
}

export function parseSetFilters(query: Query): SetFilters {
  const [yearMin, yearMax] = range(
    integer(query.year_min, 1900, 2100),
    integer(query.year_max, 1900, 2100)
  )
  const [partsMin, partsMax] = range(
    integer(query.parts_min, 0, 100_000),
    integer(query.parts_max, 0, 100_000)
  )
  const [priceMin, priceMax] = range(
    decimal(query.price_min, 0, 100_000),
    decimal(query.price_max, 0, 100_000)
  )

  return {
    q: text(query.q, 100),
    theme: text(query.theme, 255),
    yearMin,
    yearMax,
    partsMin,
    partsMax,
    priceMin,
    priceMax,
    status: oneOf(query.status, SET_STATUSES),
    type: oneOf(query.type, SET_TYPES) ?? 'set',
    sort: oneOf(query.sort, SET_SORTS),
    page: integer(query.page, 1, 100_000) ?? 1,
  }
}

/**
 * Back to query string parameters (only the non-default values), for the
 * pagination links and the form.
 */
export function filtersToQuery(filters: SetFilters): Record<string, string> {
  const query: Record<string, string> = {}
  const set = (key: string, value: string | number | null) => {
    if (value !== null && value !== '') {
      query[key] = String(value)
    }
  }
  set('q', filters.q)
  set('theme', filters.theme)
  set('year_min', filters.yearMin)
  set('year_max', filters.yearMax)
  set('parts_min', filters.partsMin)
  set('parts_max', filters.partsMax)
  set('price_min', filters.priceMin)
  set('price_max', filters.priceMax)
  set('status', filters.status)
  set('type', filters.type === 'set' ? null : filters.type)
  set('sort', filters.sort)
  return query
}
