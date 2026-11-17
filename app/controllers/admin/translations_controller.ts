import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import BrickSet from '#models/brick_set'
import { sha1 } from '#services/translation/description_translator'
import { nowForSql } from '#services/rebrickable/bulk'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'
import { setPath } from '#helpers/urls'

const PER_PAGE = 20
const FILTERS = ['todo', 'done', 'all'] as const
type Filter = (typeof FILTERS)[number]

const translationValidator = vine.create({
  descriptionFr: vine.string().trim().maxLength(20000).optional(),
})

const hasEnglish = (query: ReturnType<typeof db.from>) =>
  query.whereNotNull('description').where('description', '<>', '')

const describe = (set: BrickSet) => ({
  id: set.id,
  setNum: set.setNum,
  name: set.name,
  url: setPath(set),
  description: set.description ?? '',
  descriptionFr: set.descriptionFr ?? '',
})

/**
 * Back office: French descriptions typed directly in the site, from the
 * list of the sets to translate.
 */
export default class TranslationsController {
  /** GET /admin/traductions?statut=todo|done|all&q=&page= */
  async index({ inertia, request }: HttpContext) {
    const filter: Filter = FILTERS.includes(request.input('statut'))
      ? request.input('statut')
      : 'todo'
    const q = String(request.input('q', '')).trim().slice(0, 100)
    const page = Math.max(1, Number(request.input('page', 1)) || 1)

    const query = BrickSet.query()
      .whereNotNull('description')
      .where('description', '<>', '')
      .orderBy('year', 'desc')
      .orderBy('set_num', 'asc')
    if (filter === 'todo')
      query.where((sub) => sub.whereNull('description_fr').orWhere('description_fr', ''))
    if (filter === 'done') query.whereNotNull('description_fr').where('description_fr', '<>', '')
    if (q) {
      query.where((sub) =>
        sub.whereRaw('`name` LIKE ?', [`%${q}%`]).orWhereRaw('`set_num` LIKE ?', [`${q}%`])
      )
    }
    const result = await query.paginate(page, PER_PAGE)

    const [counts] = await hasEnglish(db.from('sets')).select(
      db.raw("SUM(description_fr IS NOT NULL AND description_fr <> '') as translated"),
      db.raw('COUNT(*) as total')
    )
    const translated = Number(counts.translated ?? 0)

    return inertia.render('admin/translations', {
      filter,
      q,
      counts: { translated, toTranslate: Number(counts.total) - translated },
      items: result.all().map(describe),
      pagination: {
        currentPage: result.currentPage,
        lastPage: result.lastPage,
        total: result.total,
        perPage: result.perPage,
      },
    })
  }

  /** PUT /admin/traductions/:id: saves (or clears) the French description */
  async update({ params, request, session, response }: HttpContext) {
    const locale = resolveLocale(request)
    const set = await BrickSet.find(params.id)
    if (!set || !set.description) {
      throw new Exception('Set introuvable', { status: 404, code: 'E_NOT_FOUND' })
    }
    const { descriptionFr } = await request.validateUsing(translationValidator)
    const french = descriptionFr || null

    await db
      .from('sets')
      .where('id', set.id)
      .update({
        description_fr: french,
        // Marked up to date with the current English text (the automatic
        // translation command then leaves it alone)
        description_fr_source_hash: french ? sha1(set.description) : null,
        description_fr_translated_at: french ? nowForSql() : null,
      })
    session.flash(
      'success',
      serverMessage(locale, french ? 'admin.translations.saved' : 'admin.translations.cleared', {
        name: set.name,
      })
    )
    return response.redirect().back()
  }
}
