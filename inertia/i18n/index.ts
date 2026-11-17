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
    return new Intl.NumberFormat(intlLocale, { style: 'currency', currency }).format(value)
  }

  /** "2017-10-01" → "01/10/2017" (same day/month/year order in both languages) */
  function formatDate(isoDate: string | null | undefined) {
    if (!isoDate) {
      return null
    }
    const [year, month, day] = isoDate.slice(0, 10).split('-')
    return `${day}/${month}/${year}`
  }

  return { locale, t, tc, formatNumber, formatPrice, formatDate }
}

/**
 * Texts and formats in the language chosen by the visitor (shared
 * `locale` prop, from the "locale" cookie).
 */
export function useI18n() {
  const { props } = usePage()
  return createI18n(props.locale)
}
