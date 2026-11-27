import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import BrickSet from '#models/brick_set'
import ThemeTree from '#services/catalogue/theme_tree'
import { filtersToQuery, parseSetFilters } from '#services/catalogue/set_filters'
import { SETS_PER_PAGE, setCatalogueQuery } from '#services/catalogue/set_query'
import { fallbackDescription } from '#services/set_description'
import BrickSetTransformer from '#transformers/brick_set_transformer'
import { setNumCandidates, setPath, themePath } from '#helpers/urls'
import { resolveLocale } from '#helpers/locale'
import { rememberListUrl } from '#helpers/catalogue_memory'
import Collection from '#services/collection'
import SetGallery from '#services/brickset/set_gallery'

export default class SetsController {
  /**
   * GET /sets: catalogue with search, filters, sort and pagination.
   * Every filter lives in the query string, so a filtered list can be shared.
   */
  async index(ctx: HttpContext) {
    const { request, inertia } = ctx
    rememberListUrl(ctx, 'sets')
    const filters = parseSetFilters(request.qs())
    const themes = await ThemeTree.load()
    const counts = await themes.setCounts()
    const page = await setCatalogueQuery(filters, themes, resolveLocale(request)).paginate(
      filters.page,
      SETS_PER_PAGE
    )

    return inertia.render('sets/index', {
      sets: BrickSetTransformer.transform(page.all()),
      pagination: {
        currentPage: page.currentPage,
        lastPage: page.lastPage,
        total: page.total,
        perPage: page.perPage,
      },
      query: filtersToQuery(filters),
      themeOptions: themes.options(counts),
      themeName: filters.theme ? (themes.bySlug.get(filters.theme)?.name ?? null) : null,
    })
  }

  /**
   * GET /sets/:ref, e.g. /sets/75192-1-millennium-falcon.
   * Outdated or partial URLs ("/sets/75192-1") redirect to the canonical one.
   */
  async show(ctx: HttpContext) {
    const { params, request, response, inertia } = ctx
    const ref = String(params.ref).toLowerCase()
    const candidates = await BrickSet.query().whereIn('set_num', setNumCandidates(ref))
    const set = candidates.sort((a, b) => b.setNum.length - a.setNum.length)[0]
    if (!set) {
      throw new Exception(`Set ${ref} introuvable`, { status: 404, code: 'E_SET_NOT_FOUND' })
    }

    const canonical = setPath(set)
    if (request.url() !== canonical) {
      return response.redirect().status(301).toPath(canonical)
    }

    await set.load('theme')
    await set.load('minifigs', (query) => query.orderBy('name'))
    // Additional pictures: fetched from Brickset at the first visit, then stored
    await SetGallery.ensure(set)
    const gallery = await SetGallery.imagesOf(set.id)

    const themes = await ThemeTree.load()
    const chain = themes.ancestorsOf(set.themeId)
    const user = ctx.auth.user
    const owned = user ? await new Collection(user).ownedSet(set.id) : null

    return inertia.render('sets/show', {
      set: BrickSetTransformer.transform(set).useVariant('forDetail'),
      themeChain: chain.map((theme) => ({ name: theme.name, url: themePath(theme) })),
      gallery,
      ownedEntry: owned ? { quantity: owned.quantity, condition: owned.condition } : null,
      fallbackDescription: set.description
        ? null
        : fallbackDescription(
            {
              kind: set.kind,
              themeName: chain[0]?.name ?? null,
              year: set.year,
              numParts: set.numParts,
              numMinifigs: set.numMinifigs,
            },
            resolveLocale(request)
          ),
    })
  }
}
