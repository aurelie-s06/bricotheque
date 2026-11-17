import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import Minifig from '#models/minifig'
import ThemeTree from '#services/catalogue/theme_tree'
import {
  MINIFIGS_PER_PAGE,
  minifigCatalogueQuery,
  minifigFiltersToQuery,
  parseMinifigFilters,
} from '#services/catalogue/minifig_query'
import MinifigTransformer from '#transformers/minifig_transformer'
import { minifigPath, setNumCandidates, themePath } from '#helpers/urls'
import { listReferer, rememberListUrl } from '#helpers/catalogue_memory'

export default class MinifigsController {
  /**
   * GET /minifigs: search by name or number, filters by main theme and year.
   */
  async index(ctx: HttpContext) {
    const { request, inertia } = ctx
    rememberListUrl(ctx, 'minifigs')
    const filters = parseMinifigFilters(request.qs())
    const themes = await ThemeTree.load()
    const counts = await themes.minifigCounts()
    const page = await minifigCatalogueQuery(filters, themes).paginate(
      filters.page,
      MINIFIGS_PER_PAGE
    )

    return inertia.render('minifigs/index', {
      minifigs: MinifigTransformer.transform(page.all()),
      pagination: {
        currentPage: page.currentPage,
        lastPage: page.lastPage,
        total: page.total,
        perPage: page.perPage,
      },
      query: minifigFiltersToQuery(filters),
      // main themes are root themes: no subtheme level in the list
      themeOptions: themes
        .roots()
        .filter((theme) => (counts.get(theme.id) ?? 0) > 0)
        .map((theme) => ({ slug: theme.slug, name: theme.name, depth: 0 })),
      themeName: filters.theme ? (themes.bySlug.get(filters.theme)?.name ?? null) : null,
    })
  }

  /**
   * GET /minifigs/:ref, e.g. /minifigs/fig-000001-toy-store-employee.
   * Outdated or partial URLs redirect to the canonical one.
   */
  async show(ctx: HttpContext) {
    const { params, request, response, inertia } = ctx
    const ref = String(params.ref).toLowerCase()
    const candidates = await Minifig.query().whereIn('fig_num', setNumCandidates(ref))
    const minifig = candidates.sort((a, b) => b.figNum.length - a.figNum.length)[0]
    if (!minifig) {
      throw new Exception(`Minifig ${ref} introuvable`, {
        status: 404,
        code: 'E_MINIFIG_NOT_FOUND',
      })
    }

    const canonical = minifigPath(minifig)
    if (request.url() !== canonical) {
      return response.redirect().status(301).toPath(canonical)
    }

    await minifig.load('mainTheme')
    await minifig.load('sets', (query) =>
      query.orderByRaw('`year` IS NULL').orderBy('year', 'asc').orderBy('set_num', 'asc')
    )

    const themes = await ThemeTree.load()
    const chain = minifig.mainThemeId ? themes.ancestorsOf(minifig.mainThemeId) : []

    return inertia.render('minifigs/show', {
      minifig: MinifigTransformer.transform(minifig).useVariant('forDetail'),
      themeChain: chain.map((theme) => ({ name: theme.name, url: themePath(theme) })),
      backUrl: listReferer(ctx),
    })
  }
}
