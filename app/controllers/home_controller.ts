import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import BrickSet from '#models/brick_set'
import ThemeTree from '#services/catalogue/theme_tree'
import BrickSetTransformer from '#transformers/brick_set_transformer'
import { themePath } from '#helpers/urls'

export default class HomeController {
  /**
   * GET /: search, popular themes (most sets) and latest released sets.
   */
  async index({ inertia }: HttpContext) {
    const themes = await ThemeTree.load()
    const counts = await themes.setCounts()

    const popularThemes = themes
      .roots()
      .map((root) => ({ name: root.name, url: themePath(root), count: counts.get(root.id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    const latestSets = await BrickSet.query()
      .where('kind', 'set')
      .whereNotNull('date_first_available')
      .where('date_first_available', '<=', DateTime.utc().toISODate()!)
      .orderBy('date_first_available', 'desc')
      .orderBy('set_num', 'asc')
      .limit(8)

    return inertia.render('home', {
      popularThemes,
      latestSets: BrickSetTransformer.transform(latestSets),
    })
  }
}
