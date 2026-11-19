import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import ThemeTree from '#services/catalogue/theme_tree'
import ManualItems, { MergeError, type Kind } from '#services/catalogue/manual_items'
import { backWithErrors } from '#helpers/form_errors'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'
import { minifigPath, setPath } from '#helpers/urls'
import { validationMessages } from '#validators/messages'

const kindOf = (value: unknown): Kind => (value === 'minifigs' ? 'minifigs' : 'sets')

const setValidator = vine.create({
  number: vine
    .string()
    .trim()
    .maxLength(20)
    .regex(/^[A-Za-z0-9]+$/),
  variant: vine.number().withoutDecimals().range([1, 99]),
  name: vine.string().trim().minLength(1).maxLength(255),
  year: vine.number().withoutDecimals().range([1949, 2100]).nullable().optional(),
  theme: vine.string().trim().maxLength(255),
  numParts: vine.number().withoutDecimals().range([0, 100000]),
  description: vine.string().trim().maxLength(20000).nullable().optional(),
})

const minifigValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  numParts: vine.number().withoutDecimals().range([0, 10000]),
  yearFirst: vine.number().withoutDecimals().range([1949, 2100]).nullable().optional(),
})

const mergeValidator = vine.create({
  targetId: vine.number().withoutDecimals().positive().nullable().optional(),
  target: vine.string().trim().maxLength(40).nullable().optional(),
  confirm: vine.accepted(),
})

/** All the themes, for the theme list of a new set */
async function themeOptions() {
  const themes = await ThemeTree.load()
  return themes.options(new Map([...themes.byId.keys()].map((id) => [id, 1])))
}

/**
 * Back office: sets and minifigs added by hand, and their merge with the
 * same item once it arrives from the imports.
 */
export default class ManualController {
  /** GET /admin/ajouts?type=sets|minifigs */
  async index({ inertia, request }: HttpContext) {
    const kind = kindOf(request.input('type'))
    const items = await ManualItems.list(kind)
    const path = (item: { number: string; slug: string }) =>
      kind === 'sets'
        ? setPath({ setNum: item.number, slug: item.slug })
        : minifigPath({ figNum: item.number, slug: item.slug })

    return inertia.render('admin/manual', {
      kind,
      items: items.map((item) => ({
        id: item.id,
        number: item.number,
        name: item.name,
        url: path(item),
        duplicates: item.duplicates.map((duplicate) => ({
          id: duplicate.id,
          number: duplicate.number,
          name: duplicate.name,
          url: path(duplicate),
        })),
      })),
    })
  }

  /** GET /admin/ajouts/nouveau?type=sets|minifigs */
  async create({ inertia, request }: HttpContext) {
    const kind = kindOf(request.input('type'))
    return inertia.render('admin/manual_create', {
      kind,
      themes: kind === 'sets' ? await themeOptions() : [],
    })
  }

  /** POST /admin/ajouts/:kind */
  async store(ctx: HttpContext) {
    const { params, request, session, response } = ctx
    const locale = resolveLocale(request)
    const messagesProvider = validationMessages(locale)
    const kind = kindOf(params.kind)

    if (kind === 'minifigs') {
      const data = await request.validateUsing(minifigValidator, { messagesProvider })
      await ManualItems.createMinifig({ ...data, yearFirst: data.yearFirst ?? null })
      session.flash('success', serverMessage(locale, 'admin.manual.created', { name: data.name }))
      return response.redirect().toPath('/admin/ajouts?type=minifigs')
    }

    const data = await request.validateUsing(setValidator, { messagesProvider })
    const themes = await ThemeTree.load()
    const theme = themes.bySlug.get(data.theme)
    if (!theme) {
      return backWithErrors(ctx, { theme: serverMessage(locale, 'admin.manual.unknownTheme') })
    }
    const setNum = ManualItems.setNum(data.number, data.variant)
    if (await ManualItems.setExists(setNum)) {
      return backWithErrors(ctx, {
        number: serverMessage(locale, 'admin.manual.setExists', { setNum }),
      })
    }
    await ManualItems.createSet({
      number: data.number,
      variant: data.variant,
      name: data.name,
      year: data.year ?? null,
      themeId: theme.id,
      numParts: data.numParts,
      description: data.description || null,
    })
    session.flash('success', serverMessage(locale, 'admin.manual.created', { name: data.name }))
    return response.redirect().toPath('/admin/ajouts?type=sets')
  }

  /**
   * POST /admin/ajouts/:kind/:id/fusion: merges the manual item into an
   * imported one, chosen among the duplicates (targetId) or by its number.
   */
  async merge(ctx: HttpContext) {
    const { params, request, session, response } = ctx
    const locale = resolveLocale(request)
    const kind = kindOf(params.kind)
    const { targetId, target } = await request.validateUsing(mergeValidator, {
      messagesProvider: validationMessages(locale),
    })

    let id = targetId
    if (!id && target) {
      const found = await ManualItems.findImported(kind, target)
      id = found ? Number(found.id) : undefined
    }
    if (!id) {
      return backWithErrors(ctx, {
        [`target-${params.id}`]: serverMessage(locale, 'admin.merge.notFound'),
      })
    }

    try {
      await ManualItems.merge(kind, Number(params.id), id)
    } catch (error) {
      if (error instanceof MergeError) {
        return backWithErrors(ctx, {
          [`target-${params.id}`]: serverMessage(
            locale,
            error.message as 'admin.merge.notManual' | 'admin.merge.notImported'
          ),
        })
      }
      throw error
    }
    session.flash('success', serverMessage(locale, 'admin.merge.done'))
    return response.redirect().toPath(`/admin/ajouts?type=${kind}`)
  }
}
