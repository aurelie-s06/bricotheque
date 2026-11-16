import string from '@adonisjs/core/helpers/string'

/**
 * Splits a Rebrickable set number into the public number and its variant:
 * "75192-1" → { number: "75192", variant: 1 }.
 */
export function parseSetNum(setNum: string): { number: string; variant: number } {
  const match = /^(.+)-(\d+)$/.exec(setNum)
  if (!match) {
    return { number: setNum, variant: 1 }
  }
  return { number: match[1], variant: Number(match[2]) }
}

/**
 * URL slug: lowercase ASCII words separated by dashes.
 * Trademark signs are dropped ("Falcon™" → "falcon"). Names without any
 * latin character fall back to `fallback`.
 */
export function makeSlug(text: string, fallback: string) {
  const cleaned = text.replace(/[™®©]/g, ' ')
  const slug = string.slug(cleaned, { lower: true, strict: true }).slice(0, 200).replace(/-+$/, '')
  return slug || fallback
}

/**
 * Parses an integer column. Empty or invalid values become `null`.
 */
export function toInteger(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') {
    return null
  }
  const number = Number(value)
  return Number.isInteger(number) ? number : null
}

export function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}
