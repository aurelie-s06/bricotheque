import type { HttpContext } from '@adonisjs/core/http'
import string from '@adonisjs/core/helpers/string'
import { Exception } from '@adonisjs/core/exceptions'
import User from '#models/user'
import Minifig from '#models/minifig'
import Collection from '#services/collection'
import ThemeTree from '#services/catalogue/theme_tree'
import MinifigTransformer from '#transformers/minifig_transformer'
import {
  collectionCounts,
  minifigsOfUser,
  setsOfUser,
  wishlistTotal,
} from '#services/collection_lists'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'

type Tab = 'sets' | 'minifigs'
const tabOf = (value: unknown): Tab => (value === 'minifigs' ? 'minifigs' : 'sets')

/**
 * List of one tab, for the collection, the wishlist and the shared wishlist.
 */
async function listProps(userId: number, status: 'owned' | 'wanted', qs: Record<string, any>) {
  const tab = tabOf(qs.type === 'minifigs' ? 'minifigs' : qs.tab)
  const filters = { ...qs }
  delete filters.tab
  const counts = await collectionCounts(userId, status)
  if (tab === 'minifigs') {
    const list = await minifigsOfUser(userId, status, filters)
    return { tab, counts, sets: [], ...list }
  }
  const list = await setsOfUser(userId, status, filters)
  return { tab, counts, minifigs: [], ...list }
}

/** Minifigs shown per page on the "missing minifigs" page */
const MISSING_PER_PAGE = 48

/** The root theme of the slug and all its subthemes, or every theme */
async function themeScope(slug: unknown) {
  const themes = await ThemeTree.load()
  const theme = typeof slug === 'string' ? themes.bySlug.get(slug) : undefined
  const root = theme ? themes.ancestorsOf(theme.id)[0] : undefined
  return { root: root ?? null, ids: root ? themes.descendantIds(root.id) : undefined }
}

export default class MyCollectionController {
  /**
   * GET /ma-collection/minifigs-manquantes?theme=slug: minifigs of the owned
   * sets (of one theme) that are not in the collection yet
   */
  async missingMinifigs({ request, inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const { root, ids } = await themeScope(request.input('theme'))
    const missing = await new Collection(user).missingMinifigsOfOwnedSets(ids)
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const minifigs = await Minifig.query()
      .whereIn(
        'id',
        missing.map((row) => row.minifig_id)
      )
      .orderBy('name', 'asc')
      .paginate(page, MISSING_PER_PAGE)

    return inertia.render('collection/missing_minifigs', {
      theme: root ? { name: root.name, slug: root.slug } : null,
      minifigs: MinifigTransformer.transform(minifigs.all()),
      pagination: {
        currentPage: minifigs.currentPage,
        lastPage: minifigs.lastPage,
        total: minifigs.total,
        perPage: minifigs.perPage,
      },
    })
  }

  /** POST /ma-collection/minifigs-manquantes (theme=slug): adds them all */
  async addMissingMinifigs({ request, auth, session, response }: HttpContext) {
    const { ids } = await themeScope(request.input('theme'))
    const count = await new Collection(auth.getUserOrFail()).addMinifigsOfOwnedSets(ids)
    session.flash(
      count > 0 ? 'success' : 'info',
      serverMessage(
        resolveLocale(request),
        count > 0 ? 'collection.ownedMinifigsAdded' : 'collection.noMissingMinifigs',
        { count }
      )
    )
    return response.redirect().toRoute('dashboard')
  }

  /** GET /ma-collection?tab=sets|minifigs&… */
  async collection({ request, inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return inertia.render('collection/list', {
      mode: 'collection' as const,
      owner: null,
      ...(await listProps(user.id, 'owned', request.qs())),
      wishlistTotal: null,
      shareUrl: null,
    })
  }

  /** GET /ma-wishlist?tab=sets|minifigs&… */
  async wishlist({ request, inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return inertia.render('collection/list', {
      mode: 'wishlist' as const,
      owner: null,
      ...(await listProps(user.id, 'wanted', request.qs())),
      wishlistTotal: await wishlistTotal(user.id),
      shareUrl: user.wishlistShareToken ? this.#shareUrl(request, user.wishlistShareToken) : null,
    })
  }

  /** GET /wishlist/:token: read-only wishlist shared by its owner */
  async shared({ params, request, inertia }: HttpContext) {
    const owner = await User.findBy('wishlist_share_token', String(params.token))
    if (!owner) {
      throw new Exception('Wishlist introuvable', { status: 404, code: 'E_WISHLIST_NOT_FOUND' })
    }
    return inertia.render('collection/list', {
      mode: 'shared' as const,
      owner: { username: owner.username },
      ...(await listProps(owner.id, 'wanted', request.qs())),
      wishlistTotal: await wishlistTotal(owner.id),
      shareUrl: null,
    })
  }

  /** POST /ma-wishlist/partage: creates (or keeps) the share link */
  async share({ auth, request, session, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (!user.wishlistShareToken) {
      user.wishlistShareToken = string.random(32)
      await user.save()
    }
    session.flash('success', serverMessage(resolveLocale(request), 'wishlist.shared'))
    return response.redirect().back()
  }

  /** POST /ma-wishlist/partage/desactiver: the old link stops working */
  async unshare({ auth, request, session, response }: HttpContext) {
    const user = auth.getUserOrFail()
    user.wishlistShareToken = null
    await user.save()
    session.flash('success', serverMessage(resolveLocale(request), 'wishlist.unshared'))
    return response.redirect().back()
  }

  #shareUrl(request: HttpContext['request'], token: string) {
    return `${request.protocol()}://${request.host()}/wishlist/${token}`
  }
}
