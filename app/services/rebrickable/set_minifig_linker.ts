import db from '@adonisjs/lucid/services/db'
import { readCsv } from '#services/rebrickable/csv'
import { emptyStats, updateById, type ImportStats } from '#services/rebrickable/bulk'
import { buildRootResolver } from '#services/rebrickable/set_kinds'
import { toInteger } from '#services/rebrickable/parsing'

export type LinkerOptions = {
  batchSize?: number
  onProgress?: (read: number) => void
  onWarning?: (message: string) => void
}

export type AggregateStats = {
  /** sets whose num_minifigs changed */
  setsRecounted: number
  /** minifigs whose main_theme_id or year_first changed */
  minifigsRecomputed: number
}

type Link = { setId: number; minifigId: number; quantity: number }

const linkKey = (setId: number, minifigId: number) => `${setId}:${minifigId}`

/**
 * Builds the set ↔ minifig links from the Rebrickable inventories, then
 * computes the fields derived from them.
 *
 * - inventories.csv: id, version, set_num (set_num can also be a fig_num:
 *   the parts inventory of a minifig, which we ignore)
 * - inventory_minifigs.csv: inventory_id, fig_num, quantity
 *
 * A set can have several inventory versions (corrected or reissued
 * contents): only the latest version is used.
 */
export default class SetMinifigLinker {
  #batchSize: number
  #onProgress: (read: number) => void
  #onWarning: (message: string) => void

  constructor(options: LinkerOptions = {}) {
    this.#batchSize = options.batchSize ?? 500
    this.#onProgress = options.onProgress ?? (() => {})
    this.#onWarning = options.onWarning ?? (() => {})
  }

  async importLinks(inventoriesPath: string, inventoryMinifigsPath: string): Promise<ImportStats> {
    const stats = emptyStats()

    const setIds = await this.#idsBy('sets', 'set_num')
    const minifigIds = await this.#idsBy('minifigs', 'fig_num')
    if (setIds.size === 0 || minifigIds.size === 0) {
      throw new Error('Importe les sets et les minifigs avant leurs liens.')
    }

    // 1. Latest inventory version of each known set
    const latestBySet = new Map<number, { inventoryId: number; version: number }>()
    for await (const record of readCsv(inventoriesPath, ['id', 'version', 'set_num'] as const)) {
      const setId = setIds.get(record.set_num)
      const inventoryId = toInteger(record.id)
      const version = toInteger(record.version) ?? 1
      if (setId === undefined || inventoryId === null) {
        continue // minifig parts inventory, or set not imported
      }
      const current = latestBySet.get(setId)
      if (!current || version > current.version) {
        latestBySet.set(setId, { inventoryId, version })
      }
    }
    const setByInventory = new Map<number, number>()
    for (const [setId, { inventoryId }] of latestBySet) {
      setByInventory.set(inventoryId, setId)
    }

    // 2. Minifigs of those inventories
    const wanted = new Map<string, Link>()
    const columns = ['inventory_id', 'fig_num', 'quantity'] as const
    for await (const record of readCsv(inventoryMinifigsPath, columns)) {
      stats.read++
      const inventoryId = toInteger(record.inventory_id)
      const quantity = toInteger(record.quantity)
      if (inventoryId === null || quantity === null || quantity < 1) {
        stats.errors++
        this.#onWarning(
          `Lien invalide ignoré (ligne ${stats.read + 1}) : ${JSON.stringify(record)}`
        )
        continue
      }

      const setId = setByInventory.get(inventoryId)
      if (setId === undefined) {
        stats.skipped++ // older inventory version, or unknown set
        continue
      }
      const minifigId = minifigIds.get(record.fig_num)
      if (minifigId === undefined) {
        stats.skipped++
        this.#onWarning(`Minifig ${record.fig_num} inconnue (inventaire ${inventoryId})`)
        continue
      }

      const key = linkKey(setId, minifigId)
      const existing = wanted.get(key)
      if (existing) {
        existing.quantity += quantity
      } else {
        wanted.set(key, { setId, minifigId, quantity })
      }
    }
    this.#onProgress(stats.read)

    await this.#syncLinks(wanted, stats)
    return stats
  }

  /**
   * - sets.num_minifigs: total number of minifigs (quantities included)
   * - minifigs.year_first: year of the first set (any kind) containing it
   * - minifigs.main_theme_id: most frequent root theme among the real sets
   *   containing it (books and gear only count when there is no real set)
   */
  async refreshAggregates(): Promise<AggregateStats> {
    const themes: { id: number; parent_id: number | null }[] = await db
      .from('themes')
      .select('id', 'parent_id')
    const rootOf = buildRootResolver(
      themes.map((theme) => ({ id: theme.id, parentId: theme.parent_id }))
    )

    const links: {
      set_id: number
      minifig_id: number
      quantity: number
      year: number | null
      theme_id: number
      kind: string
    }[] = await db
      .from('set_minifigs')
      .join('sets', 'sets.id', 'set_minifigs.set_id')
      .select(
        'set_minifigs.set_id',
        'set_minifigs.minifig_id',
        'set_minifigs.quantity',
        'sets.year',
        'sets.theme_id',
        'sets.kind'
      )

    // sets.num_minifigs
    const countBySet = new Map<number, number>()
    for (const link of links) {
      countBySet.set(link.set_id, (countBySet.get(link.set_id) ?? 0) + link.quantity)
    }
    const sets: { id: number; num_minifigs: number }[] = await db
      .from('sets')
      .select('id', 'num_minifigs')
    const setUpdates = sets
      .map((set) => ({ id: set.id, values: { num_minifigs: countBySet.get(set.id) ?? 0 } }))
      .filter((update, index) => update.values.num_minifigs !== sets[index].num_minifigs)
    await updateById('sets', ['num_minifigs'], setUpdates, this.#batchSize)

    // minifigs.year_first and minifigs.main_theme_id
    const byMinifig = new Map<
      number,
      { yearFirst: number | null; realSetRoots: number[]; allRoots: number[] }
    >()
    for (const link of links) {
      const entry = byMinifig.get(link.minifig_id) ?? {
        yearFirst: null,
        realSetRoots: [],
        allRoots: [],
      }
      if (link.year !== null && (entry.yearFirst === null || link.year < entry.yearFirst)) {
        entry.yearFirst = link.year
      }
      const root = rootOf(link.theme_id)
      entry.allRoots.push(root)
      if (link.kind === 'set') {
        entry.realSetRoots.push(root)
      }
      byMinifig.set(link.minifig_id, entry)
    }

    const minifigs: { id: number; main_theme_id: number | null; year_first: number | null }[] =
      await db.from('minifigs').select('id', 'main_theme_id', 'year_first')
    const minifigUpdates = []
    for (const minifig of minifigs) {
      const entry = byMinifig.get(minifig.id)
      const roots = entry?.realSetRoots.length ? entry.realSetRoots : (entry?.allRoots ?? [])
      const mainThemeId = mostFrequent(roots)
      const yearFirst = entry?.yearFirst ?? null
      if (mainThemeId !== minifig.main_theme_id || yearFirst !== minifig.year_first) {
        minifigUpdates.push({
          id: minifig.id,
          values: { main_theme_id: mainThemeId, year_first: yearFirst },
        })
      }
    }
    await updateById('minifigs', ['main_theme_id', 'year_first'], minifigUpdates, this.#batchSize)

    return { setsRecounted: setUpdates.length, minifigsRecomputed: minifigUpdates.length }
  }

  /**
   * Makes set_minifigs match `wanted`: inserts new links, updates changed
   * quantities and deletes links that are no longer in the dump.
   */
  async #syncLinks(wanted: Map<string, Link>, stats: ImportStats) {
    const storedRows: { set_id: number; minifig_id: number; quantity: number }[] = await db
      .from('set_minifigs')
      .select('set_id', 'minifig_id', 'quantity')
    const stored = new Map(
      storedRows.map((row) => [linkKey(row.set_id, row.minifig_id), row.quantity])
    )

    const toInsert: Link[] = []
    const toUpdate: Link[] = []
    for (const [key, link] of wanted) {
      const quantity = stored.get(key)
      if (quantity === undefined) {
        toInsert.push(link)
      } else if (quantity !== link.quantity) {
        toUpdate.push(link)
      } else {
        stats.unchanged++
      }
    }
    const toDelete = storedRows.filter((row) => !wanted.has(linkKey(row.set_id, row.minifig_id)))

    await db.transaction(async (trx) => {
      for (let index = 0; index < toInsert.length; index += this.#batchSize) {
        await trx.table('set_minifigs').multiInsert(
          toInsert.slice(index, index + this.#batchSize).map((link) => ({
            set_id: link.setId,
            minifig_id: link.minifigId,
            quantity: link.quantity,
          }))
        )
      }
      for (const link of toUpdate) {
        await trx
          .from('set_minifigs')
          .where({ set_id: link.setId, minifig_id: link.minifigId })
          .update({ quantity: link.quantity })
      }
      for (let index = 0; index < toDelete.length; index += this.#batchSize) {
        await trx
          .from('set_minifigs')
          .whereIn(
            ['set_id', 'minifig_id'],
            toDelete
              .slice(index, index + this.#batchSize)
              .map((row) => [row.set_id, row.minifig_id])
          )
          .delete()
      }
    })

    stats.created = toInsert.length
    stats.updated = toUpdate.length
    stats.deleted = toDelete.length
  }

  async #idsBy(table: 'sets' | 'minifigs', column: 'set_num' | 'fig_num') {
    const rows: { id: number; key: string }[] = await db
      .from(table)
      .select('id', `${column} as key`)
    return new Map(rows.map((row) => [row.key, row.id]))
  }
}

/**
 * Most frequent value; ties go to the smallest value so the result is stable.
 */
function mostFrequent(values: number[]): number | null {
  const counts = new Map<number, number>()
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  let best: number | null = null
  let bestCount = 0
  for (const [value, count] of counts) {
    if (count > bestCount || (count === bestCount && best !== null && value < best)) {
      best = value
      bestCount = count
    }
  }
  return best
}
