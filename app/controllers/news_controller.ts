import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import BrickSet from '#models/brick_set'
import BrickSetTransformer from '#transformers/brick_set_transformer'

/** Oldest month with a page */
export const FIRST_YEAR = 1949
const FIRST_MONTH = DateTime.fromObject({ year: FIRST_YEAR, month: 1 }, { zone: 'utc' })
/** Months offered as shortcuts above the list */
const RECENT_MONTHS = 12
/** Coming months with announced release dates, shown after the current one */
const MONTHS_AHEAD = 12
/** A month rarely has more sets; the list stays on one page */
const MAX_SETS = 300

/** "2026-11" → first day of the month, or null */
function parseMonth(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) return null
  const month = DateTime.fromFormat(value, 'yyyy-LL', { zone: 'utc' })
  return month.isValid ? month : null
}

/**
 * Coming months with at least one announced release date, and how many
 * sets come out then (estimate from the dates known today).
 */
async function comingMonths(thisMonth: DateTime) {
  const rows: { month: string; total: number }[] = await db
    .from('sets')
    .where('kind', 'set')
    .where('date_first_available', '>=', thisMonth.plus({ months: 1 }).toISODate()!)
    .where('date_first_available', '<', thisMonth.plus({ months: MONTHS_AHEAD + 1 }).toISODate()!)
    .groupByRaw("DATE_FORMAT(`date_first_available`, '%Y-%m')")
    .select(db.raw("DATE_FORMAT(`date_first_available`, '%Y-%m') AS month"))
    .count('* as total')
  return rows
    .map((row) => ({ month: String(row.month), count: Number(row.total) }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

/**
 * "Nouveautés du mois": the sets that came out in a month, and for the
 * coming months the sets announced with a release date then (an estimate
 * that can still change). Filled by the nightly update.
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
    if (!month || month < FIRST_MONTH || month > thisMonth.plus({ months: MONTHS_AHEAD })) {
      throw new Exception('Mois introuvable', { status: 404, code: 'E_MONTH_NOT_FOUND' })
    }
    if (params.month && month.equals(thisMonth)) {
      return response.redirect().clearQs().status(301).toPath('/nouveautes')
    }

    // A coming month: the sets announced then; otherwise the sets already out
    const isFuture = month > thisMonth
    const end = isFuture ? month.endOf('month') : DateTime.min(month.endOf('month'), today)
    const sets = await BrickSet.query()
      .where('kind', 'set')
      .whereBetween('date_first_available', [month.toISODate()!, end.toISODate()!])
      .orderBy('date_first_available', isFuture ? 'asc' : 'desc')
      .orderBy('set_num', 'asc')
      .limit(MAX_SETS)

    return inertia.render('news/show', {
      month: month.toFormat('yyyy-LL'),
      thisMonth: thisMonth.toFormat('yyyy-LL'),
      isFuture,
      recentMonths: Array.from({ length: RECENT_MONTHS }, (_, index) =>
        thisMonth.minus({ months: index }).toFormat('yyyy-LL')
      ),
      comingMonths: await comingMonths(thisMonth),
      firstYear: FIRST_YEAR,
      sets: BrickSetTransformer.transform(sets),
    })
  }
}
