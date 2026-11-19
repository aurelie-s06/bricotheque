import type { HttpContext } from '@adonisjs/core/http'
import BrickSet from '#models/brick_set'
import BrickSetTransformer from '#transformers/brick_set_transformer'
import HomeShowcase from '#services/catalogue/home_showcase'

export default class HomeController {
  /**
   * GET /: search over a mosaic of the latest sets, figures of the
   * catalogue, the big themes of the moment and the latest announcements
   * (sets not on sale yet, nearest release first).
   */
  async index({ inertia }: HttpContext) {
    const announcements = await BrickSet.query()
      .where('kind', 'set')
      .where('availability_status', 'upcoming')
      .orderByRaw("COALESCE(`date_first_available`, CONCAT(`year`, '-12-31')) ASC")
      .orderBy('set_num', 'asc')
      .limit(8)

    return inertia.render('home', {
      showcase: await HomeShowcase.get(),
      announcements: BrickSetTransformer.transform(announcements),
    })
  }
}
