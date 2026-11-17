/**
 * French formatting: "12,99 €", "16/11/2026", "7 541".
 */
const priceFormats = new Map<string, Intl.NumberFormat>()

export function formatPrice(value: number | null | undefined, currency = 'EUR') {
  if (value === null || value === undefined) {
    return null
  }
  let format = priceFormats.get(currency)
  if (!format) {
    format = new Intl.NumberFormat('fr-FR', { style: 'currency', currency })
    priceFormats.set(currency, format)
  }
  return format.format(value)
}

const numberFormat = new Intl.NumberFormat('fr-FR')

export function formatNumber(value: number) {
  return numberFormat.format(value)
}

/** "2017-10-01" → "01/10/2017" */
export function formatDate(isoDate: string | null | undefined) {
  if (!isoDate) {
    return null
  }
  const [year, month, day] = isoDate.slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${formatNumber(count)} ${count > 1 ? pluralForm : singular}`
}

export const STATUS_LABELS = {
  available: 'En vente',
  retired: 'Retiré',
  unknown: 'Statut inconnu',
} as const

export const KIND_LABELS = {
  set: 'Sets',
  book: 'Livres',
  gear: 'Produits dérivés',
  parts: 'Lots de pièces',
  bundle: 'Lots de sets',
  all: 'Tout',
} as const
