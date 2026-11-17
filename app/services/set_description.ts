import type { Locale } from '#helpers/locale'

const NOUNS: Record<Locale, Record<string, string>> = {
  fr: { set: 'Set', book: 'Livre', gear: 'Article', parts: 'Lot de pièces', bundle: 'Lot de sets' },
  en: { set: 'Set', book: 'Book', gear: 'Item', parts: 'Parts pack', bundle: 'Bundle' },
}

/**
 * Replacement text shown when a set has no Brickset description.
 * It is generated at display time, in the visitor's language, and never stored.
 *
 * fr: "Set Ninjago de 2021 comprenant 1 234 pièces et 6 minifigures."
 * en: "Ninjago set from 2021 with 1,234 pieces and 6 minifigures."
 */
export function fallbackDescription(
  set: {
    kind?: string
    themeName?: string | null
    year?: number | null
    numParts: number
    numMinifigs: number
  },
  locale: Locale = 'fr'
) {
  const noun = NOUNS[locale][set.kind ?? 'set'] ?? NOUNS[locale].set
  const format = (value: number) =>
    value.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB').replace(/\s/g, '\u00a0')
  const count = (value: number, singular: string, plural: string) =>
    `${format(value)} ${(locale === 'fr' ? value > 1 : value !== 1) ? plural : singular}`

  const parts: string[] = []
  if (set.numParts > 0) {
    parts.push(
      count(
        set.numParts,
        locale === 'fr' ? 'pièce' : 'piece',
        locale === 'fr' ? 'pièces' : 'pieces'
      )
    )
  }
  if (set.numMinifigs > 0) {
    parts.push(count(set.numMinifigs, 'minifigure', 'minifigures'))
  }
  const joiner = locale === 'fr' ? ' et ' : ' and '

  if (locale === 'fr') {
    let text = noun
    if (set.themeName) text += ` ${set.themeName}`
    if (set.year) text += ` de ${set.year}`
    if (parts.length) text += ` comprenant ${parts.join(joiner)}`
    return `${text}.`
  }

  let text = set.themeName ? `${set.themeName} ${noun.toLowerCase()}` : noun
  if (set.year) text += ` from ${set.year}`
  if (parts.length) text += ` with ${parts.join(joiner)}`
  return `${text}.`
}
