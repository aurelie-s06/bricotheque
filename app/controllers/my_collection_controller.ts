import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import string from '@adonisjs/core/helpers/string'
import db from '@adonisjs/lucid/services/db'
import { Exception } from '@adonisjs/core/exceptions'
import User from '#models/user'
import {
  collectionCounts,
  minifigsOfUser,
  setsOfUser,
  wishlistTotal,
} from '#services/collection_lists'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'
import { toCsv } from '#helpers/csv'

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

export default class MyCollectionController {
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
    return response.redirect().toRoute('wishlist.index')
  }

  /** POST /ma-wishlist/partage/desactiver: the old link stops working */
  async unshare({ auth, request, session, response }: HttpContext) {
    const user = auth.getUserOrFail()
    user.wishlistShareToken = null
    await user.save()
    session.flash('success', serverMessage(resolveLocale(request), 'wishlist.unshared'))
    return response.redirect().toRoute('wishlist.index')
  }

  /**
   * GET /ma-collection/export.csv: the whole collection, sets then
   * minifigs. Semicolon-separated with a BOM, so Excel opens it directly.
   */
  async export({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const locale = resolveLocale(request)
    const sets = await db
      .from('user_sets')
      .join('sets', 'sets.id', 'user_sets.set_id')
      .join('themes', 'themes.id', 'sets.theme_id')
      .where({ 'user_sets.user_id': user.id, 'user_sets.status': 'owned' })
      .orderBy('sets.set_num')
      .select(
        'sets.set_num',
        'sets.name',
        'themes.name as theme',
        'sets.year',
        'sets.num_parts',
        'user_sets.quantity',
        'user_sets.condition',
        'user_sets.purchase_price',
        db.raw("DATE_FORMAT(user_sets.purchase_date, '%Y-%m-%d') as purchase_date"),
        'sets.rrp_eur',
        'user_sets.note'
      )
    const minifigs = await db
      .from('user_minifigs')
      .join('minifigs', 'minifigs.id', 'user_minifigs.minifig_id')
      .leftJoin('themes', 'themes.id', 'minifigs.main_theme_id')
      .where({ 'user_minifigs.user_id': user.id, 'user_minifigs.status': 'owned' })
      .orderBy('minifigs.fig_num')
      .select(
        'minifigs.fig_num',
        'minifigs.name',
        'themes.name as theme',
        'minifigs.year_first',
        'minifigs.num_parts',
        'user_minifigs.quantity',
        'user_minifigs.note'
      )

    const fr = locale === 'fr'
    const header = fr
      ? [
          'Type',
          'Numéro',
          'Nom',
          'Thème',
          'Année',
          'Pièces',
          'Quantité',
          'État',
          'Prix d’achat (€)',
          'Date d’achat',
          'Prix d’origine (€)',
          'Note',
        ]
      : [
          'Type',
          'Number',
          'Name',
          'Theme',
          'Year',
          'Pieces',
          'Quantity',
          'Condition',
          'Purchase price (€)',
          'Purchase date',
          'Original price (€)',
          'Note',
        ]
    const conditions: Record<string, string> = fr
      ? { built: 'Monté', in_box: 'En boîte', sealed: 'Neuf scellé', partial: 'Incomplet' }
      : { built: 'Built', in_box: 'In box', sealed: 'Sealed', partial: 'Incomplete' }
    const decimal = (value: unknown) =>
      value === null || value === undefined
        ? ''
        : fr
          ? String(value).replace('.', ',')
          : String(value)

    const rows = [
      header,
      ...sets.map((set) => [
        'Set',
        set.set_num,
        set.name,
        set.theme,
        set.year,
        set.num_parts,
        set.quantity,
        set.condition ? conditions[set.condition] : '',
        decimal(set.purchase_price),
        set.purchase_date ?? '',
        decimal(set.rrp_eur),
        set.note ?? '',
      ]),
      ...minifigs.map((minifig) => [
        'Minifig',
        minifig.fig_num,
        minifig.name,
        minifig.theme ?? '',
        minifig.year_first ?? '',
        minifig.num_parts,
        minifig.quantity,
        '',
        '',
        '',
        '',
        minifig.note ?? '',
      ]),
    ]

    const filename = `briquotheque-collection-${DateTime.utc().toISODate()}.csv`
    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header('Content-Disposition', `attachment; filename="${filename}"`)
    return response.send(`\uFEFF${toCsv(rows, ';')}`)
  }

  #shareUrl(request: HttpContext['request'], token: string) {
    return `${request.protocol()}://${request.host()}/wishlist/${token}`
  }
}
