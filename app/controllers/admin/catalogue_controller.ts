import type { HttpContext } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'
import { DateTime } from 'luxon'
import vine from '@vinejs/vine'
import BrickSet from '#models/brick_set'
import Minifig from '#models/minifig'
import { availabilityStatus } from '#services/brickset/set_data'
import { parseLocked, serializeLocked } from '#services/catalogue/locked_fields'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'
import { minifigPath, setPath } from '#helpers/urls'
import { validationMessages } from '#validators/messages'

type Kind = 'sets' | 'minifigs'
const PER_PAGE = 24
const STATUSES = ['upcoming', 'available', 'retired', 'unknown'] as const

const kindOf = (value: unknown): Kind => (value === 'minifigs' ? 'minifigs' : 'sets')

/** Form field → database column, for each kind */
const SET_FIELDS = {
  name: 'name',
  year: 'year',
  numParts: 'num_parts',
  subtheme: 'subtheme',
  description: 'description',
  rrpEur: 'rrp_eur',
  rrpUsd: 'rrp_usd',
  rrpGbp: 'rrp_gbp',
  dateFirstAvailable: 'date_first_available',
  dateLastAvailable: 'date_last_available',
  availabilityStatus: 'availability_status',
} as const
const MINIFIG_FIELDS = { name: 'name', numParts: 'num_parts' } as const

type SetField = keyof typeof SET_FIELDS
type Values = Record<string, string | number | null>

const price = () => vine.number().min(0).max(100000).nullable().optional()
const date = () =>
  vine
    .date({ formats: ['YYYY-MM-DD'] })
    .nullable()
    .optional()

const setValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  year: vine.number().withoutDecimals().range([1949, 2100]).nullable().optional(),
  numParts: vine.number().withoutDecimals().range([0, 100000]),
  subtheme: vine.string().trim().maxLength(255).nullable().optional(),
  description: vine.string().trim().maxLength(20000).nullable().optional(),
  rrpEur: price(),
  rrpUsd: price(),
  rrpGbp: price(),
  dateFirstAvailable: date(),
  dateLastAvailable: date(),
  /** "auto": computed from the dates and the year, as the import does */
  availabilityStatus: vine.enum(['auto', ...STATUSES]),
})

const minifigValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(255),
  numParts: vine.number().withoutDecimals().range([0, 10000]),
})

const releaseValidator = vine.create({
  fields: vine.array(vine.string().trim().maxLength(50)).minLength(1),
})

async function findItem(kind: Kind, id: unknown) {
  const item =
    kind === 'sets' ? await BrickSet.find(Number(id) || 0) : await Minifig.find(Number(id) || 0)
  if (!item) throw new Exception('Élément introuvable', { status: 404, code: 'E_NOT_FOUND' })
  return item
}

const isoDate = (value: DateTime | null) => (value ? value.toISODate() : null)

/** Current values of the editable fields, as the form shows them */
function currentValues(kind: Kind, item: BrickSet | Minifig): Values {
  if (kind === 'minifigs') return { name: item.name, numParts: item.numParts }
  const set = item as BrickSet
  return {
    name: set.name,
    year: set.year,
    numParts: set.numParts,
    subtheme: set.subtheme,
    description: set.description,
    rrpEur: set.rrpEur === null ? null : Number(set.rrpEur),
    rrpUsd: set.rrpUsd === null ? null : Number(set.rrpUsd),
    rrpGbp: set.rrpGbp === null ? null : Number(set.rrpGbp),
    dateFirstAvailable: isoDate(set.dateFirstAvailable),
    dateLastAvailable: isoDate(set.dateLastAvailable),
    availabilityStatus: set.availabilityStatus,
  }
}

function describe(kind: Kind, item: BrickSet | Minifig) {
  const isSet = kind === 'sets'
  const fields: Record<string, string> = isSet ? SET_FIELDS : MINIFIG_FIELDS
  const locked = parseLocked(item.lockedFields)
  return {
    kind,
    id: item.id,
    number: isSet ? (item as BrickSet).setNum : (item as Minifig).figNum,
    name: item.name,
    url: isSet ? setPath(item as BrickSet) : minifigPath(item as Minifig),
    values: currentValues(kind, item),
    /** Form fields corrected by hand (kept by the imports) */
    locked: Object.keys(fields).filter((field) => locked.has(fields[field])),
  }
}

/** Form values → model attributes (dates as Luxon dates) */
function applySet(set: BrickSet, field: SetField, value: string | number | null) {
  switch (field) {
    case 'dateFirstAvailable':
    case 'dateLastAvailable':
      set[field] = value ? DateTime.fromISO(String(value)) : null
      break
    case 'availabilityStatus':
      set.availabilityStatus = value as BrickSet['availabilityStatus']
      break
    default:
      ;(set as unknown as Values)[field] = value
  }
}

/**
 * Back office: corrections of the catalogue (sets and minifigs). The fields
 * changed here are "locked": the imports no longer overwrite them.
 */
export default class CatalogueController {
  /** GET /admin/catalogue?type=sets|minifigs&q=&page= */
  async index({ inertia, request }: HttpContext) {
    const kind = kindOf(request.input('type'))
    const q = String(request.input('q', '')).trim().slice(0, 100)
    const page = Math.max(1, Number(request.input('page', 1)) || 1)

    const query = kind === 'sets' ? BrickSet.query() : Minifig.query()
    const numberColumn = kind === 'sets' ? 'set_num' : 'fig_num'
    if (q) {
      query.where((sub) =>
        sub
          .whereRaw('`name` LIKE ?', [`%${q}%`])
          .orWhereRaw(`\`${numberColumn}\` LIKE ?`, [`${q}%`])
      )
      query.orderBy(numberColumn, 'asc')
    } else {
      // Without a search: the items already corrected by hand
      query.whereNotNull('locked_fields').orderBy('updated_at', 'desc')
    }
    const result = await query.paginate(page, PER_PAGE)

    return inertia.render('admin/catalogue', {
      kind,
      q,
      items: result.all().map((item) => {
        const { values, ...rest } = describe(kind, item)
        return { ...rest, year: kind === 'sets' ? (values.year as number | null) : null }
      }),
      pagination: {
        currentPage: result.currentPage,
        lastPage: result.lastPage,
        total: result.total,
        perPage: result.perPage,
      },
    })
  }

  /** GET /admin/catalogue/:kind/:id */
  async edit({ inertia, params }: HttpContext) {
    const kind = kindOf(params.kind)
    const item = await findItem(kind, params.id)
    return inertia.render('admin/catalogue_edit', { item: describe(kind, item) })
  }

  /** PUT /admin/catalogue/:kind/:id: saves the corrections and locks the changed fields */
  async update({ params, request, session, response }: HttpContext) {
    const locale = resolveLocale(request)
    const kind = kindOf(params.kind)
    const item = await findItem(kind, params.id)
    const messagesProvider = validationMessages(locale)
    const before = currentValues(kind, item)
    const locked = parseLocked(item.lockedFields)

    if (kind === 'minifigs') {
      const data = await request.validateUsing(minifigValidator, { messagesProvider })
      for (const field of Object.keys(MINIFIG_FIELDS) as (keyof typeof MINIFIG_FIELDS)[]) {
        if (before[field] === data[field]) continue
        ;(item as unknown as Values)[field] = data[field]
        locked.add(MINIFIG_FIELDS[field])
      }
    } else {
      const set = item as BrickSet
      const data = await request.validateUsing(setValidator, { messagesProvider })
      const next: Values = {
        ...data,
        year: data.year ?? null,
        subtheme: data.subtheme || null,
        description: data.description || null,
        rrpEur: data.rrpEur ?? null,
        rrpUsd: data.rrpUsd ?? null,
        rrpGbp: data.rrpGbp ?? null,
        dateFirstAvailable: data.dateFirstAvailable ? data.dateFirstAvailable.toISODate() : null,
        dateLastAvailable: data.dateLastAvailable ? data.dateLastAvailable.toISODate() : null,
      }

      for (const field of Object.keys(SET_FIELDS) as SetField[]) {
        if (field === 'availabilityStatus') continue
        if (before[field] === next[field]) continue
        applySet(set, field, next[field])
        locked.add(SET_FIELDS[field])
      }

      // Status: chosen by hand (locked), or computed again from the dates
      if (data.availabilityStatus === 'auto') {
        locked.delete('availability_status')
        set.availabilityStatus = availabilityStatus({
          year: set.year,
          dateFirstAvailable: isoDate(set.dateFirstAvailable),
          dateLastAvailable: isoDate(set.dateLastAvailable),
        })
      } else {
        if (before.availabilityStatus !== data.availabilityStatus) {
          applySet(set, 'availabilityStatus', data.availabilityStatus)
        }
        locked.add('availability_status')
      }
    }

    item.lockedFields = serializeLocked(locked)
    await item.save()
    session.flash('success', serverMessage(locale, 'admin.catalogue.saved', { name: item.name }))
    return response.redirect().back()
  }

  /**
   * POST /admin/catalogue/:kind/:id/liberer: the next imports update these
   * fields again (the current values stay until then).
   */
  async release({ params, request, session, response }: HttpContext) {
    const locale = resolveLocale(request)
    const kind = kindOf(params.kind)
    const item = await findItem(kind, params.id)
    const { fields } = await request.validateUsing(releaseValidator)
    const columns: Record<string, string> = kind === 'sets' ? SET_FIELDS : MINIFIG_FIELDS
    const locked = parseLocked(item.lockedFields)
    for (const field of fields) {
      if (columns[field]) locked.delete(columns[field])
    }
    item.lockedFields = serializeLocked(locked)
    await item.save()
    session.flash('success', serverMessage(locale, 'admin.catalogue.released', { name: item.name }))
    return response.redirect().back()
  }
}
