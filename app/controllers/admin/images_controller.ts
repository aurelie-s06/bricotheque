import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import BrickSet from '#models/brick_set'
import Minifig from '#models/minifig'
import ImageUrlCheck from '#services/admin/image_url_check'
import { backWithErrors } from '#helpers/form_errors'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'
import { minifigPath, setPath } from '#helpers/urls'

/** Date format of the MySQL DATETIME columns (as Lucid writes them) */
const SQL_DATETIME = 'yyyy-LL-dd HH:mm:ss'

type Kind = 'sets' | 'minifigs'
const PER_PAGE = 24

const kindOf = (value: unknown): Kind => (value === 'minifigs' ? 'minifigs' : 'sets')

const imageValidator = vine.create({ url: vine.string().trim().maxLength(500) })

async function findItem(kind: Kind, id: number) {
  const item = kind === 'sets' ? await BrickSet.find(id) : await Minifig.find(id)
  if (!item) throw new Exception('Élément introuvable', { status: 404, code: 'E_NOT_FOUND' })
  return item
}

function describe(kind: Kind, item: BrickSet | Minifig) {
  const isSet = kind === 'sets'
  const set = item as BrickSet
  const minifig = item as Minifig
  return {
    kind,
    id: item.id,
    number: isSet ? set.setNum : minifig.figNum,
    name: item.name,
    url: isSet ? setPath(set) : minifigPath(minifig),
    importedUrl: item.imgUrl,
    manualUrl: item.imgUrlManual,
    broken: item.imgBrokenAt !== null,
  }
}

/**
 * Back office: sets and minifigs without a picture (or with a broken one),
 * and the manual picture URL, which wins over the imported one and is
 * never overwritten by the imports.
 */
export default class ImagesController {
  /** GET /admin/images?type=sets|minifigs&page= */
  async index({ inertia, request }: HttpContext) {
    const kind = kindOf(request.input('type'))
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const Model = kind === 'sets' ? BrickSet : Minifig
    const result = await Model.query()
      .whereNull('img_url_manual')
      .where((query) => query.whereNull('img_url').orWhereNotNull('img_broken_at'))
      .orderByRaw('img_broken_at IS NULL')
      .orderBy(kind === 'sets' ? 'set_num' : 'fig_num')
      .paginate(page, PER_PAGE)

    return inertia.render('admin/images', {
      kind,
      items: (result.all() as (BrickSet | Minifig)[]).map((item) => describe(kind, item)),
      pagination: {
        currentPage: result.currentPage,
        lastPage: result.lastPage,
        total: result.total,
        perPage: result.perPage,
      },
    })
  }

  /** GET /admin/images/:kind/:id */
  async edit({ inertia, params }: HttpContext) {
    const kind = kindOf(params.kind)
    const item = await findItem(kind, Number(params.id))
    return inertia.render('admin/image_edit', { item: describe(kind, item) })
  }

  /** PUT /admin/images/:kind/:id: saves (or clears) the manual picture */
  async update(ctx: HttpContext) {
    const { params, request, session, response } = ctx
    const locale = resolveLocale(request)
    const kind = kindOf(params.kind)
    const item = await findItem(kind, Number(params.id))
    const { url } = await request.validateUsing(imageValidator)

    if (url === '') {
      item.imgUrlManual = null
    } else {
      const check = await ImageUrlCheck.check(url)
      if (!check.ok) {
        return backWithErrors(ctx, { url: serverMessage(locale, `admin.image.${check.reason}`) })
      }
      item.imgUrlManual = url
    }
    item.imgBrokenAt = null
    await item.save()
    session.flash('success', serverMessage(locale, 'admin.image.saved', { name: item.name }))
    return response.redirect().back()
  }

  /**
   * POST /admin/images/:kind/:id/cassee: the browser of an administrator
   * could not load the picture (sent by the page, without reloading it).
   */
  async reportBroken({ params, response }: HttpContext) {
    const kind = kindOf(params.kind)
    await db
      .from(kind)
      .where('id', Number(params.id))
      .whereNull('img_url_manual')
      .update({ img_broken_at: DateTime.now().toFormat(SQL_DATETIME) })
    return response.noContent()
  }
}
