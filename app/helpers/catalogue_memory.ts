import type { HttpContext } from '@adonisjs/core/http'

/**
 * Remembers the last list of sets and of minifigs (filters, sort, page),
 * so that the "Sets" / "Minifigs" links of the menu and the breadcrumb go
 * back to it instead of an unfiltered list.
 */
const KEYS = { sets: 'catalogue.sets', minifigs: 'catalogue.minifigs' } as const
type Catalogue = keyof typeof KEYS

const DEFAULT_URLS: Record<Catalogue, string> = { sets: '/sets', minifigs: '/minifigs' }

export function rememberListUrl(ctx: HttpContext, catalogue: Catalogue) {
  ctx.session.put(KEYS[catalogue], ctx.request.url(true))
}

export function catalogueUrls(ctx: Partial<HttpContext>): Record<Catalogue, string> {
  const session = ctx.session
  const read = (catalogue: Catalogue) => {
    const value = session?.get(KEYS[catalogue])
    return typeof value === 'string' && value.startsWith(DEFAULT_URLS[catalogue])
      ? value
      : DEFAULT_URLS[catalogue]
  }
  return { sets: read('sets'), minifigs: read('minifigs') }
}
