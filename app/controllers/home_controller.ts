import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import BrickSet from '#models/brick_set'
import BrickSetTransformer from '#transformers/brick_set_transformer'

export default class HomeController {
  /**
   * GET /: search and latest released sets.
   */
  async index({ inertia }: HttpContext) {
    const latestSets = await BrickSet.query()
      .where('kind', 'set')
      .whereNotNull('date_first_available')
      .where('date_first_available', '<=', DateTime.utc().toISODate()!)
      .orderBy('date_first_available', 'desc')
      .orderBy('set_num', 'asc')
      .limit(8)

    return inertia.render('home', {
      latestSets: BrickSetTransformer.transform(latestSets),
    })
  }
}
