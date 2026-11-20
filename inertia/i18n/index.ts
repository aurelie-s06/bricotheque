import { createElement, Fragment, type ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import fr from '~/i18n/fr'
import en from '~/i18n/en'

export type Locale = 'fr' | 'en'
export type MessageKey = keyof typeof fr

/** Plural keys without their _one / _other suffix */
type PluralKey = {
  [K in MessageKey]: K extends `${infer Base}_one` ? Base : never
}[MessageKey]

const dictionaries: Record<Locale, Record<MessageKey, string>> = { fr, en }

/** Intl locales: en-GB keeps day/month/year dates */
const intlLocales: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB' }

export function createI18n(locale: Locale) {
  const messages = dictionaries[locale] ?? fr
  const intlLocale = intlLocales[locale]
  const numberFormat = new Intl.NumberFormat(intlLocale)

  function t(key: MessageKey, params: Record<string, string | number> = {}) {
    return messages[key].replace(/\{(\w+)\}/g, (match, name: string) =>
      name in params ? String(params[name]) : match
    )
  }

  function formatNumber(value: number) {
    return numberFormat.format(value)
  }

  /** "1 234 pièces" / "1 piece": French uses the singular for 0 and 1 */
  function tc(key: PluralKey, count: number, params: Record<string, string | number> = {}) {
    const singular = locale === 'fr' ? count <= 1 : count === 1
    const fullKey = `${key}_${singular ? 'one' : 'other'}` as MessageKey
    return t(fullKey, { ...params, count: formatNumber(count) })
  }

  function formatPrice(value: number | null | undefined, currency = 'EUR') {
    if (value === null || value === undefined) {
      return null
    }
    // "narrowSymbol": "849,99 $" and "$849.99", not "$US" / "US$"
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
    }).format(value)
  }

  /** Currency of the prices: euros on the French site, dollars on the English one */
  const priceCurrency = locale === 'en' ? 'USD' : 'EUR'

  /**
   * Original price of a set in the currency of the language, or in the
   * other one when it is unknown (rather than "unknown price").
   */
  function formatSetPrice(set: { rrpEur: number | null; rrpUsd?: number | null }) {
    const usd = set.rrpUsd ?? null
    if (locale === 'en') {
      return formatPrice(usd, 'USD') ?? formatPrice(set.rrpEur, 'EUR')
    }
    return formatPrice(set.rrpEur, 'EUR') ?? formatPrice(usd, 'USD')
  }

  /**
   * "2017-10-01" → "1 octobre 2017" / "1 October 2017": the month in words
   * leaves no doubt about the day/month order (Opquast rule 4).
   */
  const dateFormat = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  function formatDate(isoDate: string | null | undefined) {
    if (!isoDate) {
      return null
    }
    return dateFormat.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`))
  }

  /** "17 novembre 2026, 17:08" from an ISO date-time, in the site language */
  const dateTimeFormat = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  function formatDateTime(iso: string | null | undefined) {
    return iso ? dateTimeFormat.format(new Date(iso)) : null
  }

  /** Date in a <time> element, readable by programs too (Opquast rule 231) */
  function dateNode(isoDate: string | null | undefined): ReactNode {
    const text = formatDate(isoDate)
    return text ? createElement('time', { dateTime: isoDate!.slice(0, 10) }, text) : null
  }

  /** Like t(), but the parameters can be elements (e.g. dates in <time>) */
  function tn(key: MessageKey, params: Record<string, ReactNode>): ReactNode {
    const parts = messages[key].split(/\{(\w+)\}/)
    return createElement(
      Fragment,
      null,
      ...parts.map((part, index) =>
        index % 2 === 1
          ? createElement(Fragment, { key: index }, part in params ? params[part] : `{${part}}`)
          : part
      )
    )
  }

  return {
    locale,
    t,
    tc,
    tn,
    formatNumber,
    formatPrice,
    formatSetPrice,
    priceCurrency,
    formatDate,
    formatDateTime,
    dateNode,
  }
}

/**
 * Texts and formats in the language chosen by the visitor (shared
 * `locale` prop, from the "locale" cookie).
 */
export function useI18n() {
  const { props } = usePage()
  return createI18n(props.locale)
}
