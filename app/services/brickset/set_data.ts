import he from 'he'
import { DateTime } from 'luxon'
import type { BricksetSet } from '#services/brickset/types'

export type AvailabilityStatus = 'available' | 'retired' | 'unknown'

/** Number of years after which a set without exit date is considered retired */
export const RETIRED_AFTER_YEARS = 3

/**
 * Availability rule:
 * 1. A known exit date decides: today or later → available, past → retired.
 * 2. Without exit date, a set released more than 3 years ago → retired
 *    (release = first availability date, or 1 January of its year).
 * 3. Without exit date, a set already released (first availability date
 *    in the past) → available.
 * 4. Otherwise (not released yet, or no data at all) → unknown.
 */
export function availabilityStatus(
  set: { year: number | null; dateFirstAvailable: string | null; dateLastAvailable: string | null },
  today: DateTime = DateTime.utc()
): AvailabilityStatus {
  const day = today.toISODate()!

  if (set.dateLastAvailable) {
    return set.dateLastAvailable >= day ? 'available' : 'retired'
  }

  const release = set.dateFirstAvailable ?? (set.year ? `${set.year}-01-01` : null)
  if (release && release < today.minus({ years: RETIRED_AFTER_YEARS }).toISODate()!) {
    return 'retired'
  }
  if (set.dateFirstAvailable && set.dateFirstAvailable <= day) {
    return 'available'
  }
  return 'unknown'
}

/**
 * "2017-10-01T00:00:00Z" → "2017-10-01"
 */
export function toDate(value: string | undefined): string | null {
  if (!value) {
    return null
  }
  const date = DateTime.fromISO(value, { zone: 'utc' })
  return date.isValid ? date.toISODate() : null
}

/**
 * Brickset descriptions are HTML from LEGO.com: keep the paragraphs and
 * line breaks, drop the tags, decode the entities (&reg;, &rsquo;…).
 */
export function htmlToText(html: string | undefined): string | null {
  if (!html) {
    return null
  }
  const text = he
    .decode(
      html
        .replace(/<\s*br\s*\/?\s*>/gi, '\n')
        .replace(/<\s*\/\s*(p|div|li|h[1-6])\s*>/gi, '\n\n')
        .replace(/<\s*li[^>]*>/gi, '• ')
        .replace(/<[^>]*>/g, '')
    )
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text || null
}

function price(value: number | undefined): number | null {
  return typeof value === 'number' && value > 0 ? value : null
}

/**
 * Columns of our `sets` table filled from a Brickset set.
 * Prices come from LEGO.com: Germany for EUR, plus US and UK.
 */
export function bricksetColumns(set: BricksetSet) {
  const subtheme = set.subtheme?.trim()
  return {
    brickset_id: set.setID,
    rrp_eur: price(set.LEGOCom?.DE?.retailPrice),
    rrp_usd: price(set.LEGOCom?.US?.retailPrice),
    rrp_gbp: price(set.LEGOCom?.UK?.retailPrice),
    date_first_available: toDate(set.launchDate),
    date_last_available: toDate(set.exitDate),
    subtheme: subtheme && subtheme !== '{None}' ? subtheme : null,
    description: htmlToText(set.extendedData?.description),
  }
}

export type BricksetColumns = ReturnType<typeof bricksetColumns>

export function setNumOf(set: BricksetSet) {
  return `${set.number}-${set.numberVariant}`
}
