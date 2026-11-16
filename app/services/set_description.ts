/**
 * Replacement text shown when a set has no Brickset description.
 * It is generated at display time and never stored.
 *
 * "Set Ninjago de 2021 comprenant 1 234 pièces et 6 minifigures."
 */
export function fallbackDescription(set: {
  kind?: string
  themeName?: string | null
  year?: number | null
  numParts: number
  numMinifigs: number
}) {
  const nouns: Record<string, string> = {
    set: 'Set',
    book: 'Livre',
    gear: 'Article',
    parts: 'Lot de pièces',
    bundle: 'Lot de sets',
  }
  let text = nouns[set.kind ?? 'set'] ?? 'Set'
  if (set.themeName) {
    text += ` ${set.themeName}`
  }
  if (set.year) {
    text += ` de ${set.year}`
  }

  const parts: string[] = []
  if (set.numParts > 0) {
    parts.push(`${formatNumber(set.numParts)} pièce${set.numParts > 1 ? 's' : ''}`)
  }
  if (set.numMinifigs > 0) {
    parts.push(`${formatNumber(set.numMinifigs)} minifigure${set.numMinifigs > 1 ? 's' : ''}`)
  }
  if (parts.length) {
    text += ` comprenant ${parts.join(' et ')}`
  }
  return `${text}.`
}

/** French thousands separator, as a non-breaking space: "1 234" never wraps */
function formatNumber(value: number) {
  return value.toLocaleString('fr-FR').replace(/\s/g, '\u00a0')
}
