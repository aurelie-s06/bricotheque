import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import BrickSet from '#models/brick_set'
import ThemeTree from '#services/catalogue/theme_tree'
import ThemePictures from '#services/catalogue/theme_pictures'
import { SETS_PER_PAGE } from '#services/catalogue/set_query'
import BrickSetTransformer from '#transformers/brick_set_transformer'
import { setPath, themePath } from '#helpers/urls'

/** Recent years in which the flagship set of a theme is looked for */
const FEATURED_YEARS = 5

/**
 * Flagship set of a theme for its banner: the biggest set (most pieces)
 * of the last years, or of all time, with a picture.
 */
async function featuredSet(themeIds: number[]) {
  const base = () =>
    BrickSet.query()
      .whereIn('theme_id', themeIds)
      .where('kind', 'set')
      .whereNotNull('img_url')
      .whereNull('img_broken_at')
      .where((query) => query.whereNull('year').orWhere('year', '<=', DateTime.utc().year))
      .orderBy('num_parts', 'desc')
  return (
    (await base()
      .where('year', '>=', DateTime.utc().year - FEATURED_YEARS + 1)
      .first()) ?? (await base().first())
  )
}

export default class ThemesController {
  /**
   * GET /themes: root themes and their subthemes, with their number of sets.
   */
  async index({ inertia }: HttpContext) {
    const themes = await ThemeTree.load()
    const counts = await themes.setCounts()
    const withSets = (id: number) => (counts.get(id) ?? 0) > 0

    const pictures = await ThemePictures.get(themes)

    return inertia.render('themes/index', {
      themes: themes
        .roots()
        .filter((root) => withSets(root.id))
        .map((root) => ({
          name: root.name,
          url: themePath(root),
          count: counts.get(root.id) ?? 0,
          image: pictures.get(root.id) ?? null,
          subthemes: themes
            .childrenOf(root.id)
            .filter((child) => withSets(child.id))
            .map((child) => ({
              name: child.name,
              url: themePath(child),
              count: counts.get(child.id) ?? 0,
            })),
        })),
    })
  }

  /**
   * GET /themes/:slug: sets of the theme and its subthemes, by year.
   */
  async show({ params, request, inertia }: HttpContext) {
    const themes = await ThemeTree.load()
    const theme = themes.bySlug.get(String(params.slug))
    if (!theme) {
      throw new Exception(`Thème ${params.slug} introuvable`, {
        status: 404,
        code: 'E_THEME_NOT_FOUND',
      })
    }

    const counts = await themes.setCounts()
    const pageNumber = Math.max(1, Number.parseInt(String(request.input('page', '1')), 10) || 1)
    const page = await BrickSet.query()
      .whereIn('theme_id', themes.descendantIds(theme.id))
      .orderByRaw('`year` IS NULL')
      .orderBy('year', 'desc')
      .orderByRaw('LENGTH(`number`) ASC')
      .orderBy('number', 'asc')
      .orderBy('variant', 'asc')
      .paginate(pageNumber, SETS_PER_PAGE)

    const ids = themes.descendantIds(theme.id)
    const featured = await featuredSet(ids)
    const [years] = await db
      .from('sets')
      .whereIn('theme_id', ids)
      .where('kind', 'set')
      .min('year as first')
      .max('year as last')

    return inertia.render('themes/show', {
      theme: {
        name: theme.name,
        url: themePath(theme),
        count: counts.get(theme.id) ?? 0,
        firstYear: years?.first ? Number(years.first) : null,
        lastYear: years?.last ? Number(years.last) : null,
      },
      featured: featured
        ? {
            setNum: featured.setNum,
            name: featured.name,
            url: setPath(featured),
            imgUrl: featured.imgUrl,
            year: featured.year,
            numParts: featured.numParts,
          }
        : null,
      themeChain: themes
        .ancestorsOf(theme.id)
        .map((ancestor) => ({ name: ancestor.name, url: themePath(ancestor) })),
      subthemes: themes
        .childrenOf(theme.id)
        .filter((child) => (counts.get(child.id) ?? 0) > 0)
        .map((child) => ({
          name: child.name,
          url: themePath(child),
          count: counts.get(child.id) ?? 0,
        })),
      sets: BrickSetTransformer.transform(page.all()),
      pagination: {
        currentPage: page.currentPage,
        lastPage: page.lastPage,
        total: page.total,
        perPage: page.perPage,
      },
    })
  }
}
