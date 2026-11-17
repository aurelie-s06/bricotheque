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

/** Lists that lead to a set or minifig page */
const LIST_PATHS = [/^\/sets$/, /^\/minifigs$/, /^\/themes\/[\w-]+$/, /^\/recherche$/]

/**
 * URL of the list the visitor comes from (same site only), for the
 * "Back to results" link of a detail page; null otherwise.
 */
export function listReferer(ctx: HttpContext): string | null {
  const referer = ctx.request.header('referer')
  if (!referer) {
    return null
  }
  try {
    const url = new URL(referer)
    if (url.host !== ctx.request.host()) {
      return null
    }
    return LIST_PATHS.some((pattern) => pattern.test(url.pathname))
      ? `${url.pathname}${url.search}`
      : null
  } catch {
    return null
  }
}
