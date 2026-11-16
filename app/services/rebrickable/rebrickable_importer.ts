import db from '@adonisjs/lucid/services/db'
import { readCsv } from '#services/rebrickable/csv'
import { emptyStats, upsertBatch, type ImportStats } from '#services/rebrickable/bulk'
import {
  buildKindResolver,
  KIND_BY_ROOT_THEME,
  type SetKind,
} from '#services/rebrickable/set_kinds'
import { emptyToNull, makeSlug, parseSetNum, toInteger } from '#services/rebrickable/parsing'

export type { ImportStats } from '#services/rebrickable/bulk'

export type ImporterOptions = {
  batchSize?: number
  /** called after each batch with the number of rows read so far */
  onProgress?: (read: number) => void
  /** called for each skipped or invalid row */
  onWarning?: (message: string) => void
}

type ThemeRow = { id: number; name: string; slug: string; parent_id: number | null }

type SetRow = {
  set_num: string
  number: string
  variant: number
  name: string
  slug: string
  year: number | null
  theme_id: number
  kind: SetKind
  num_parts: number
  img_url: string | null
}

type MinifigRow = {
  fig_num: string
  name: string
  slug: string
  num_parts: number
  img_url: string | null
}

/** Columns refreshed from Rebrickable on every import (Brickset/BrickLink data is never touched). */
const SET_COLUMNS = [
  'number',
  'variant',
  'name',
  'slug',
  'year',
  'theme_id',
  'kind',
  'num_parts',
  'img_url',
] as const

/** Columns refreshed on every import (computed fields and BrickLink values are never touched). */
const MINIFIG_COLUMNS = ['name', 'slug', 'num_parts', 'img_url'] as const

/**
 * Imports the Rebrickable CSV dumps into our tables, with upserts:
 * running it again updates existing rows and never creates duplicates.
 */
export default class RebrickableImporter {
  #batchSize: number
  #onProgress: (read: number) => void
  #onWarning: (message: string) => void

  constructor(options: ImporterOptions = {}) {
    this.#batchSize = options.batchSize ?? 500
    this.#onProgress = options.onProgress ?? (() => {})
    this.#onWarning = options.onWarning ?? (() => {})
  }

  /**
   * themes.csv: id, name, parent_id
   *
   * Two passes: themes are first upserted without their parent, then
   * `parent_id` is set once every theme exists (a child can be listed
   * before its parent).
   */
  async importThemes(path: string): Promise<ImportStats> {
    const stats = emptyStats()
    const rows: ThemeRow[] = []

    for await (const record of readCsv(path, ['id', 'name', 'parent_id'] as const)) {
      stats.read++
      const id = toInteger(record.id)
      const name = emptyToNull(record.name)
      if (id === null || name === null) {
        stats.errors++
        this.#onWarning(
          `Thème invalide ignoré (ligne ${stats.read + 1}) : ${JSON.stringify(record)}`
        )
        continue
      }
      rows.push({ id, name, slug: '', parent_id: toInteger(record.parent_id) })
    }

    this.#assignThemeSlugs(rows)
    this.#warnOnRenamedKindRoots(rows)

    const knownIds = new Set(rows.map((row) => row.id))
    const storedThemes: ThemeRow[] = await db
      .from('themes')
      .select('id', 'name', 'slug', 'parent_id')
    const existing = new Map(storedThemes.map((row) => [row.id, row]))
    const changedIds = new Set<number>()

    // Pass 1: name and slug
    const toWrite = rows.filter((row) => {
      const current = existing.get(row.id)
      if (!current) {
        stats.created++
        return true
      }
      if (current.name !== row.name || current.slug !== row.slug) {
        changedIds.add(row.id)
        return true
      }
      return false
    })
    for (let index = 0; index < toWrite.length; index += this.#batchSize) {
      const batch = toWrite.slice(index, index + this.#batchSize)
      await db
        .knexQuery()
        .table('themes')
        .insert(batch.map(({ id, name, slug }) => ({ id, name, slug, parent_id: null })))
        .onConflict('id')
        .merge(['name', 'slug'])
    }

    // Pass 2: parents
    await db.transaction(async (trx) => {
      for (const row of rows) {
        let parentId = row.parent_id
        if (parentId !== null && !knownIds.has(parentId)) {
          this.#onWarning(`Thème ${row.id} : parent ${parentId} inconnu, rattaché à la racine`)
          parentId = null
        }
        const current = existing.get(row.id)
        if (current && current.parent_id === parentId) {
          continue
        }
        if (current) {
          changedIds.add(row.id)
        }
        if (current || parentId !== null) {
          await trx.from('themes').where('id', row.id).update({ parent_id: parentId })
        }
      }
    })

    stats.updated = changedIds.size
    stats.unchanged = rows.length - stats.created - stats.updated
    this.#onProgress(stats.read)
    return stats
  }

  /**
   * sets.csv: set_num, name, year, theme_id, num_parts, img_url
   * Themes must be imported first.
   */
  async importSets(path: string): Promise<ImportStats> {
    const stats = emptyStats()
    const themes = await db.from('themes').select('id', 'parent_id')
    if (themes.length === 0) {
      throw new Error('Aucun thème en base : importe les thèmes avant les sets.')
    }
    const themeIds = new Set<number>(themes.map((theme: { id: number }) => theme.id))
    const kindOf = buildKindResolver(
      themes.map((theme: { id: number; parent_id: number | null }) => ({
        id: theme.id,
        parentId: theme.parent_id,
      }))
    )

    let batch: SetRow[] = []
    const columns = ['set_num', 'name', 'year', 'theme_id', 'num_parts', 'img_url'] as const

    for await (const record of readCsv(path, columns)) {
      stats.read++
      const setNum = emptyToNull(record.set_num)
      const name = emptyToNull(record.name)
      const themeId = toInteger(record.theme_id)

      if (setNum === null || name === null || themeId === null) {
        stats.errors++
        this.#onWarning(`Set invalide ignoré (ligne ${stats.read + 1}) : ${JSON.stringify(record)}`)
        continue
      }
      if (!themeIds.has(themeId)) {
        stats.skipped++
        this.#onWarning(`Set ${setNum} ignoré : thème ${themeId} inconnu`)
        continue
      }

      const { number, variant } = parseSetNum(setNum)
      batch.push({
        set_num: setNum,
        number,
        variant,
        name,
        slug: makeSlug(name, 'set'),
        year: toInteger(record.year),
        theme_id: themeId,
        kind: kindOf(themeId),
        num_parts: toInteger(record.num_parts) ?? 0,
        img_url: emptyToNull(record.img_url),
      })

      if (batch.length >= this.#batchSize) {
        await this.#upsertSets(batch, stats)
        batch = []
        this.#onProgress(stats.read)
      }
    }

    if (batch.length) {
      await this.#upsertSets(batch, stats)
    }
    this.#onProgress(stats.read)
    return stats
  }

  /**
   * minifigs.csv: fig_num, name, num_parts, img_url
   */
  async importMinifigs(path: string): Promise<ImportStats> {
    const stats = emptyStats()
    let batch: MinifigRow[] = []

    for await (const record of readCsv(path, [
      'fig_num',
      'name',
      'num_parts',
      'img_url',
    ] as const)) {
      stats.read++
      const figNum = emptyToNull(record.fig_num)
      const name = emptyToNull(record.name)

      if (figNum === null || name === null) {
        stats.errors++
        this.#onWarning(
          `Minifig invalide ignorée (ligne ${stats.read + 1}) : ${JSON.stringify(record)}`
        )
        continue
      }

      batch.push({
        fig_num: figNum,
        name,
        slug: makeSlug(name, 'minifig'),
        num_parts: toInteger(record.num_parts) ?? 0,
        img_url: emptyToNull(record.img_url),
      })

      if (batch.length >= this.#batchSize) {
        await this.#upsertMinifigs(batch, stats)
        batch = []
        this.#onProgress(stats.read)
      }
    }

    if (batch.length) {
      await this.#upsertMinifigs(batch, stats)
    }
    this.#onProgress(stats.read)
    return stats
  }

  #upsertSets(rows: SetRow[], stats: ImportStats) {
    return upsertBatch({ table: 'sets', key: 'set_num', columns: SET_COLUMNS, rows, stats })
  }

  #upsertMinifigs(rows: MinifigRow[], stats: ImportStats) {
    return upsertBatch({ table: 'minifigs', key: 'fig_num', columns: MINIFIG_COLUMNS, rows, stats })
  }

  /**
   * Theme slugs must be unique (they are used in /themes/:slug), but names
   * are not: "Technic" exists at the root and under "Books". Duplicated
   * names are prefixed with their parent's name, then suffixed with the id
   * as a last resort.
   */
  #assignThemeSlugs(rows: ThemeRow[]) {
    const byId = new Map(rows.map((row) => [row.id, row]))
    const baseSlug = (row: ThemeRow) => makeSlug(row.name, `theme-${row.id}`)

    const countByBase = new Map<string, number>()
    for (const row of rows) {
      const base = baseSlug(row)
      countByBase.set(base, (countByBase.get(base) ?? 0) + 1)
    }

    const used = new Set<string>()
    const sorted = [...rows].sort((a, b) => a.id - b.id)
    for (const row of sorted) {
      const base = baseSlug(row)
      let slug = base
      if ((countByBase.get(base) ?? 0) > 1) {
        const parent = row.parent_id === null ? undefined : byId.get(row.parent_id)
        slug = parent ? makeSlug(`${parent.name} ${row.name}`, base) : base
      }
      if (used.has(slug)) {
        slug = `${slug}-${row.id}`
      }
      used.add(slug)
      row.slug = slug
    }
  }

  #warnOnRenamedKindRoots(rows: ThemeRow[]) {
    const byId = new Map(rows.map((row) => [row.id, row]))
    for (const [id, { name }] of Object.entries(KIND_BY_ROOT_THEME)) {
      const theme = byId.get(Number(id))
      if (!theme || theme.name !== name || theme.parent_id !== null) {
        this.#onWarning(
          `Le thème racine ${id} devrait être « ${name} » : vérifie app/services/rebrickable/set_kinds.ts`
        )
      }
    }
  }
}
