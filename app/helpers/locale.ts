import type { HttpRequest } from '@adonisjs/core/http'

export const LOCALES = ['fr', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'fr'
export const LOCALE_COOKIE = 'locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/**
 * Language of the visitor: the "locale" cookie (set by the language
 * switcher), otherwise the browser language when it is English,
 * otherwise French.
 */
export function resolveLocale(request: HttpRequest | undefined): Locale {
  if (!request) {
    return DEFAULT_LOCALE
  }
  const cookie = request.plainCookie(LOCALE_COOKIE)
  if (isLocale(cookie)) {
    return cookie
  }
  const accepted = request.header('accept-language') ?? ''
  const preferred = accepted.split(',')[0]?.trim().slice(0, 2).toLowerCase()
  return preferred === 'en' ? 'en' : DEFAULT_LOCALE
}

/**
 * Only local paths are accepted as return URL (no open redirect).
 */
export function safeReturnPath(value: unknown) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}

/**
 * Original price shown to the visitor: euros on the French site, dollars
 * on the English one. Used to filter and sort by price as well.
 */
export function priceColumn(locale: Locale): 'rrp_eur' | 'rrp_usd' {
  return locale === 'en' ? 'rrp_usd' : 'rrp_eur'
}

export function priceCurrency(locale: Locale): 'EUR' | 'USD' {
  return locale === 'en' ? 'USD' : 'EUR'
}
