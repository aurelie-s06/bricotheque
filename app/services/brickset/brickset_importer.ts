import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { updateById, nowForSql } from '#services/rebrickable/bulk'
import {
  availabilityStatus,
  bricksetColumns,
  setNumOf,
  type BricksetColumns,
} from '#services/brickset/set_data'
import type { BricksetApi, BricksetSet, GetSetsResponse } from '#services/brickset/types'

/** Brickset returns at most 500 sets per page */
export const PAGE_SIZE = 500

/** Calls kept in reserve below the daily limit */
export const QUOTA_MARGIN = 2

/**
 * Where a full import is: the list of years to fetch (computed once, so a
 * resumed import walks the same list), the current year and page.
 */
export type BricksetCursor = { years: number[]; yearIndex: number; page: number }

export type BricksetStats = {
  /** sets received from Brickset */
  read: number
  /** our sets whose Brickset data changed */
  updated: number
  /** our sets already up to date */
  unchanged: number
  /** Brickset sets that are not in our catalogue */
  skipped: number
  errors: number
  /** getSets calls made by this run */
  apiCalls: number
  /** pages read from the local cache instead of the API */
  cachedPages: number
  /** sets whose availability_status changed */
  availabilityChanged: number
}

export type BricksetImporterOptions = {
  /** max getSets calls per day (Brickset quota) */
  dailyLimit?: number
  /** sets per page (Brickset maximum: 500) */
  pageSize?: number
  /** directory for cached API responses */
  cacheDirectory: string
  /** cached pages younger than this are reused (0 = never) */
  cacheHours?: number
  /** pause between two API calls */
  delayMs?: number
  today?: DateTime
  onProgress?: (message: string) => void
  onWarning?: (message: string) => void
  /** called after each page, to persist the cursor */
  onCursor?: (cursor: BricksetCursor, stats: BricksetStats) => Promise<void> | void
}

export type ImportOutcome = {
  stats: BricksetStats
  /** false when stopped by the quota: resume with the cursor */
  finished: boolean
  cursor: BricksetCursor
  quotaUsed: number
}

const DATA_COLUMNS = [
  'brickset_id',
  'rrp_eur',
  'rrp_usd',
  'rrp_gbp',
  'date_first_available',
  'date_last_available',
  'subtheme',
  'description',
] as const

type StoredSet = { id: number; set_num: string } & BricksetColumns

export class QuotaReachedError extends Error {}

/**
 * Enriches our sets with Brickset data (prices, dates, subtheme,
 * description), then recomputes `availability_status`.
 *
 * Sets are fetched year by year (pages of 500): about a hundred getSets
 * calls for the whole catalogue, where theme × year would need thousands.
 * They are matched with ours by number + variant ("75192-1").
 */
export default class BricksetImporter {
  #api: BricksetApi
  #dailyLimit: number
  #pageSize: number
  #cacheDirectory: string
  #cacheHours: number
  #delayMs: number
  #today: DateTime
  #onProgress: (message: string) => void
  #onWarning: (message: string) => void
  #onCursor: NonNullable<BricksetImporterOptions['onCursor']>

  #quotaUsed = 0
  #stats: BricksetStats = BricksetImporter.emptyStats()

  constructor(api: BricksetApi, options: BricksetImporterOptions) {
    this.#api = api
    this.#dailyLimit = options.dailyLimit ?? 100
    this.#pageSize = options.pageSize ?? PAGE_SIZE
    this.#cacheDirectory = options.cacheDirectory
    this.#cacheHours = options.cacheHours ?? 20
    this.#delayMs = options.delayMs ?? 1000
    this.#today = options.today ?? DateTime.utc()
    this.#onProgress = options.onProgress ?? (() => {})
    this.#onWarning = options.onWarning ?? (() => {})
    this.#onCursor = options.onCursor ?? (() => {})
  }

  static emptyStats(): BricksetStats {
    return {
      read: 0,
      updated: 0,
      unchanged: 0,
      skipped: 0,
      errors: 0,
      apiCalls: 0,
      cachedPages: 0,
      availabilityChanged: 0,
    }
  }

  /**
   * Years to fetch, most recent first (they change the most): from next
   * year down to the oldest year of our catalogue.
   */
  async yearsToImport(): Promise<number[]> {
    const row = await db.from('sets').min('year as oldest').first()
    const oldest = Number(row?.oldest ?? this.#today.year)
    const years: number[] = []
    for (let year = this.#today.year + 1; year >= oldest; year--) {
      years.push(year)
    }
    return years
  }

  /**
   * Full import, year by year. Stops cleanly when the daily quota is
   * almost reached; `cursor` then tells where to resume.
   */
  async importAll(resumeFrom?: BricksetCursor): Promise<ImportOutcome> {
    this.#stats = BricksetImporter.emptyStats()
    await this.#loadQuota()

    const cursor: BricksetCursor = resumeFrom
      ? { ...resumeFrom }
      : { years: await this.yearsToImport(), yearIndex: 0, page: 1 }

    try {
      while (cursor.yearIndex < cursor.years.length) {
        const year = cursor.years[cursor.yearIndex]
        const response = await this.#fetchPage(year, cursor.page)
        await this.#applySets(response.sets)

        const pages = Math.max(1, Math.ceil(response.matches / this.#pageSize))
        this.#onProgress(
          `${year} page ${cursor.page}/${pages} : ${response.sets.length} sets (total ${this.#stats.read})`
        )

        if (cursor.page < pages) {
          cursor.page++
        } else {
          cursor.yearIndex++
          cursor.page = 1
        }
        await this.#onCursor({ ...cursor }, { ...this.#stats })
      }
    } catch (error) {
      if (error instanceof QuotaReachedError) {
        await this.refreshAvailability()
        return { stats: this.#stats, finished: false, cursor, quotaUsed: this.#quotaUsed }
      }
      throw error
    }

    await this.refreshAvailability()
    return { stats: this.#stats, finished: true, cursor, quotaUsed: this.#quotaUsed }
  }

  /**
   * One set only (debug): `--set=75192-1`.
   */
  async importOne(setNum: string): Promise<ImportOutcome> {
    this.#stats = BricksetImporter.emptyStats()
    await this.#loadQuota()

    const set = await db.from('sets').where('set_num', setNum).select('id').first()
    if (!set) {
      throw new Error(`Set ${setNum} introuvable dans le catalogue (lance import:rebrickable)`)
    }

    this.#assertQuota()
    const response = await this.#api.getSets({ setNumber: setNum, extendedData: 1 })
    this.#countCall()
    if (response.sets.length === 0) {
      this.#onWarning(`Set ${setNum} absent de Brickset`)
    }
    await this.#applySets(response.sets)
    await this.refreshAvailability([set.id])

    return {
      stats: this.#stats,
      finished: true,
      cursor: { years: [], yearIndex: 0, page: 1 },
      quotaUsed: this.#quotaUsed,
    }
  }

  /**
   * Recomputes availability_status of every set (or of the given ids),
   * including sets unknown to Brickset (decided by their year).
   */
  async refreshAvailability(ids?: number[]) {
    const query = db
      .from('sets')
      .select(
        'id',
        'year',
        'availability_status',
        db.raw("DATE_FORMAT(date_first_available, '%Y-%m-%d') as date_first_available"),
        db.raw("DATE_FORMAT(date_last_available, '%Y-%m-%d') as date_last_available")
      )
    if (ids) {
      query.whereIn('id', ids)
    }
    const sets: {
      id: number
      year: number | null
      availability_status: string
      date_first_available: string | null
      date_last_available: string | null
    }[] = await query

    const updates = []
    for (const set of sets) {
      const status = availabilityStatus(
        {
          year: set.year,
          dateFirstAvailable: set.date_first_available,
          dateLastAvailable: set.date_last_available,
        },
        this.#today
      )
      if (status !== set.availability_status) {
        updates.push({ id: set.id, values: { availability_status: status } })
      }
    }
    await updateById('sets', ['availability_status'], updates)
    this.#stats.availabilityChanged += updates.length
  }

  async #loadQuota() {
    this.#quotaUsed = await this.#api.getSetsCallsToday()
  }

  #assertQuota() {
    if (this.#quotaUsed >= this.#dailyLimit - QUOTA_MARGIN) {
      throw new QuotaReachedError(
        `Quota Brickset presque atteint (${this.#quotaUsed}/${this.#dailyLimit} appels getSets aujourd'hui)`
      )
    }
  }

  #countCall() {
    this.#quotaUsed++
    this.#stats.apiCalls++
  }

  /**
   * A page from the cache when it is recent enough, otherwise from the API
   * (then cached). Cached pages do not count towards the quota.
   */
  async #fetchPage(year: number, page: number): Promise<GetSetsResponse> {
    const cacheFile = join(this.#cacheDirectory, `sets-${year}-page-${page}.json`)

    if (this.#cacheHours > 0) {
      try {
        const info = await stat(cacheFile)
        const ageHours = (Date.now() - info.mtimeMs) / 3_600_000
        if (ageHours < this.#cacheHours) {
          const content = await readFile(cacheFile, 'utf8')
          this.#stats.cachedPages++
          return JSON.parse(content) as GetSetsResponse
        }
      } catch {
        // not cached yet
      }
    }

    this.#assertQuota()
    if (this.#stats.apiCalls > 0 && this.#delayMs > 0) {
      await sleep(this.#delayMs)
    }
    const response = await this.#api.getSets({
      year: String(year),
      pageSize: this.#pageSize,
      pageNumber: page,
      extendedData: 1,
      orderBy: 'Number',
    })
    this.#countCall()

    await mkdir(this.#cacheDirectory, { recursive: true })
    await writeFile(cacheFile, JSON.stringify(response))
    return response
  }

  /**
   * Matches Brickset sets with ours and writes their data. Every matched
   * set gets a new brickset_synced_at; `updated` only counts real changes.
   */
  async #applySets(sets: BricksetSet[]) {
    if (sets.length === 0) {
      return
    }
    this.#stats.read += sets.length

    const bySetNum = new Map<string, BricksetSet>()
    for (const set of sets) {
      // numberVariant can be 0: random packs of collectible minifigs ("71048-0")
      if (!set.number || typeof set.numberVariant !== 'number' || !set.setID) {
        this.#stats.errors++
        this.#onWarning(`Set Brickset invalide : ${JSON.stringify(set).slice(0, 200)}`)
        continue
      }
      bySetNum.set(setNumOf(set), set)
    }

    const stored: StoredSet[] = await db
      .from('sets')
      .whereIn('set_num', [...bySetNum.keys()])
      .select(
        'id',
        'set_num',
        'brickset_id',
        'rrp_eur',
        'rrp_usd',
        'rrp_gbp',
        'subtheme',
        'description',
        db.raw("DATE_FORMAT(date_first_available, '%Y-%m-%d') as date_first_available"),
        db.raw("DATE_FORMAT(date_last_available, '%Y-%m-%d') as date_last_available")
      )
    const storedBySetNum = new Map(stored.map((row) => [row.set_num, row]))

    const syncedAt = nowForSql()
    const updates = []
    for (const [setNum, set] of bySetNum) {
      const current = storedBySetNum.get(setNum)
      if (!current) {
        this.#stats.skipped++
        continue
      }
      const values = bricksetColumns(set)
      const changed = DATA_COLUMNS.some((column) => !sameValue(current[column], values[column]))
      if (changed) {
        this.#stats.updated++
      } else {
        this.#stats.unchanged++
      }
      updates.push({ id: current.id, values: { ...values, brickset_synced_at: syncedAt } })
    }

    // A Brickset id still held by another of our sets (renumbered on one
    // side or the other) would break the unique index: release it first.
    if (updates.length) {
      await db
        .from('sets')
        .whereIn(
          'brickset_id',
          updates.map((update) => update.values.brickset_id)
        )
        .whereNotIn(
          'id',
          updates.map((update) => update.id)
        )
        .update({ brickset_id: null })
    }

    await updateById('sets', [...DATA_COLUMNS, 'brickset_synced_at'], updates)
  }
}

/** DECIMAL columns come back as strings from MySQL */
function sameValue(stored: unknown, next: string | number | null) {
  if (stored === null || next === null) {
    return stored === next
  }
  if (typeof next === 'number') {
    return Number(stored) === next
  }
  return String(stored) === next
}
