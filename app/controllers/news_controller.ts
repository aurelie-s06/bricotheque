import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import BrickSet from '#models/brick_set'
import BrickSetTransformer from '#transformers/brick_set_transformer'

/** Oldest month with a page, and how far ahead the announcements go */
const FIRST_MONTH = DateTime.fromObject({ year: 1949, month: 1 }, { zone: 'utc' })
const MONTHS_AHEAD = 24
/** A month rarely has more sets; the list stays on one page */
const MAX_SETS = 300

/** "2026-11" → first day of the month, or null */
function parseMonth(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) return null
  const month = DateTime.fromFormat(value, 'yyyy-LL', { zone: 'utc' })
  return month.isValid ? month : null
}

/**
 * "Nouveautés du mois": sets out this month and sets announced for later
 * in the month. Filled by the nightly update; one page per month.
 */
export default class NewsController {
  /** GET /nouveautes (this month) and GET /nouveautes/:month (e.g. 2026-11) */
  async show({ params, inertia }: HttpContext) {
    const today = DateTime.utc().startOf('day')
    const thisMonth = today.startOf('month')
    const month = params.month ? parseMonth(params.month) : thisMonth
    if (!month || month < FIRST_MONTH || month > thisMonth.plus({ months: MONTHS_AHEAD })) {
      throw new Exception('Mois introuvable', { status: 404, code: 'E_MONTH_NOT_FOUND' })
    }

    const end = month.endOf('month')
    const sets = await BrickSet.query()
      .where('kind', 'set')
      .whereBetween('date_first_available', [month.toISODate()!, end.toISODate()!])
      .orderBy('date_first_available', 'asc')
      .orderBy('set_num', 'asc')
      .limit(MAX_SETS)

    const day = today.toISODate()!
    const isOut = (set: BrickSet) => (set.dateFirstAvailable?.toISODate() ?? '') <= day
    const released = sets.filter(isOut).reverse() // newest first
    const upcoming = sets.filter((set) => !isOut(set))

    const previous = month.minus({ months: 1 })
    const next = month.plus({ months: 1 })
    return inertia.render('news/show', {
      month: month.toFormat('yyyy-LL'),
      isCurrent: month.equals(thisMonth),
      previous: previous >= FIRST_MONTH ? previous.toFormat('yyyy-LL') : null,
      next: next <= thisMonth.plus({ months: MONTHS_AHEAD }) ? next.toFormat('yyyy-LL') : null,
      released: BrickSetTransformer.transform(released),
      upcoming: BrickSetTransformer.transform(upcoming),
    })
  }
}
