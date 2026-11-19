import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import BrickSet from '#models/brick_set'
import BrickSetTransformer from '#transformers/brick_set_transformer'

/** Oldest month with a page */
export const FIRST_YEAR = 1949
const FIRST_MONTH = DateTime.fromObject({ year: FIRST_YEAR, month: 1 }, { zone: 'utc' })
/** Months offered as shortcuts above the list */
const RECENT_MONTHS = 12
/** A month rarely has more sets; the list stays on one page */
const MAX_SETS = 300

/** "2026-11" → first day of the month, or null */
function parseMonth(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) return null
  const month = DateTime.fromFormat(value, 'yyyy-LL', { zone: 'utc' })
  return month.isValid ? month : null
}

/**
 * "Nouveautés du mois": the sets that came out in a month (the coming
 * ones are on the home page). Filled by the nightly update.
 */
export default class NewsController {
  /**
   * GET /nouveautes (this month), GET /nouveautes/:month (e.g. 2026-11),
   * and GET /nouveautes?annee=2020&mois=03 (the "other month" form)
   */
  async show({ params, request, response, inertia }: HttpContext) {
    const today = DateTime.utc().startOf('day')
    const thisMonth = today.startOf('month')

    const year = request.input('annee')
    const monthNumber = request.input('mois')
    if (!params.month && year && monthNumber) {
      return response
        .redirect()
        .clearQs()
        .toPath(
          `/nouveautes/${String(year).padStart(4, '0')}-${String(monthNumber).padStart(2, '0')}`
        )
    }

    const month = params.month ? parseMonth(params.month) : thisMonth
    if (!month || month < FIRST_MONTH || month > thisMonth) {
      throw new Exception('Mois introuvable', { status: 404, code: 'E_MONTH_NOT_FOUND' })
    }
    if (params.month && month.equals(thisMonth)) {
      return response.redirect().clearQs().status(301).toPath('/nouveautes')
    }

    const end = DateTime.min(month.endOf('month'), today)
    const sets = await BrickSet.query()
      .where('kind', 'set')
      .whereBetween('date_first_available', [month.toISODate()!, end.toISODate()!])
      .orderBy('date_first_available', 'desc')
      .orderBy('set_num', 'asc')
      .limit(MAX_SETS)

    return inertia.render('news/show', {
      month: month.toFormat('yyyy-LL'),
      thisMonth: thisMonth.toFormat('yyyy-LL'),
      recentMonths: Array.from({ length: RECENT_MONTHS }, (_, index) =>
        thisMonth.minus({ months: index }).toFormat('yyyy-LL')
      ),
      firstYear: FIRST_YEAR,
      sets: BrickSetTransformer.transform(sets),
    })
  }
}
