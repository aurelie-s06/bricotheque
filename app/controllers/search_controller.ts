import type { HttpContext } from '@adonisjs/core/http'
import ThemeTree from '#services/catalogue/theme_tree'
import { parseSetFilters } from '#services/catalogue/set_filters'
import { setCatalogueQuery } from '#services/catalogue/set_query'
import { minifigCatalogueQuery, parseMinifigFilters } from '#services/catalogue/minifig_query'
import BrickSetTransformer from '#transformers/brick_set_transformer'
import MinifigTransformer from '#transformers/minifig_transformer'

/** Results shown per section; the full lists are one click away */
const PREVIEW_SIZE = 12

export default class SearchController {
  /**
   * GET /recherche?q=…: sets and minifigs matching the search, in two sections.
   */
  async index({ request, inertia }: HttpContext) {
    const q = String(request.input('q', '')).trim().replace(/\s+/g, ' ').slice(0, 100)
    if (!q) {
      return inertia.render('search', {
        q,
        sets: [],
        setsTotal: 0,
        minifigs: [],
        minifigsTotal: 0,
      })
    }

    const themes = await ThemeTree.load()
    const [sets, minifigs] = await Promise.all([
      setCatalogueQuery(parseSetFilters({ q }), themes).paginate(1, PREVIEW_SIZE),
      minifigCatalogueQuery(parseMinifigFilters({ q }), themes).paginate(1, PREVIEW_SIZE),
    ])

    return inertia.render('search', {
      q,
      sets: BrickSetTransformer.transform(sets.all()),
      setsTotal: sets.total,
      minifigs: MinifigTransformer.transform(minifigs.all()),
      minifigsTotal: minifigs.total,
    })
  }
}
