import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

/** Date format of the MySQL DATETIME columns (as Lucid writes them) */
const SQL_DATETIME = 'yyyy-LL-dd HH:mm:ss'

/** A checked picture is checked again after this delay */
export const RECHECK_AFTER = { days: 30 }
/** Pictures checked each night after the update */
export const NIGHTLY_LIMIT = 5000
/** Requests at the same time (polite with the picture servers) */
const CONCURRENCY = 8
const TIMEOUT_MS = 10_000

export type ImageState = 'ok' | 'broken' | 'unknown'
type Kind = 'sets' | 'minifigs'
type Candidate = { kind: Kind; id: number; url: string }
export type ImageCheckStats = { checked: number; broken: number; unknown: number; total: number }

/**
 * Finds the broken pictures of the catalogue without browsing the site:
 * the server asks each picture server whether the picture still exists.
 * Only the imported pictures are checked (a manual picture is checked when
 * it is saved). A picture that does not answer (timeout, server error) is
 * left as it is and tried again next time.
 */
export default class ImageHealth {
  /** Replaced in the tests */
  static fetcher: typeof fetch = (input, init) => fetch(input, init)

  /** "ok": an image; "broken": not found or not an image; "unknown": no answer */
  static async checkUrl(url: string): Promise<ImageState> {
    for (const method of ['HEAD', 'GET'] as const) {
      try {
        const response = await this.fetcher(url, {
          method,
          redirect: 'follow',
          signal: AbortSignal.timeout(TIMEOUT_MS),
          headers: method === 'GET' ? { Range: 'bytes=0-0' } : undefined,
        })
        const type = response.headers.get('content-type') ?? ''
        if (response.ok) {
          if (type.startsWith('image/')) return 'ok'
          // Some servers do not give the type on HEAD: ask with GET
          if (method === 'GET') return 'broken'
          continue
        }
        if ([404, 410].includes(response.status)) return 'broken'
        // HEAD refused (405…): try GET; other errors: no conclusion
        if (method === 'GET' || response.status >= 500 || response.status === 429) return 'unknown'
      } catch {
        if (method === 'GET') return 'unknown'
      }
    }
    return 'unknown'
  }

  /** Pictures to check: never checked first, then the oldest checks */
  static async candidates(limit: number, all = false): Promise<Candidate[]> {
    const before = DateTime.now().minus(RECHECK_AFTER).toFormat(SQL_DATETIME)
    const result: Candidate[] = []
    for (const kind of ['sets', 'minifigs'] as const) {
      if (result.length >= limit) break
      const query = db
        .from(kind)
        .whereNotNull('img_url')
        .whereNull('img_url_manual')
        .orderByRaw('`img_checked_at` IS NOT NULL')
        .orderBy('img_checked_at', 'asc')
        .orderBy('id', 'asc')
        .limit(limit - result.length)
        .select('id', 'img_url')
      if (!all) {
        query.where((sub) => sub.whereNull('img_checked_at').orWhere('img_checked_at', '<', before))
      }
      const rows: { id: number; img_url: string }[] = await query
      result.push(...rows.map((row) => ({ kind, id: Number(row.id), url: row.img_url })))
    }
    return result
  }

  /** How many pictures a full check would look at */
  static async countAll() {
    let total = 0
    for (const kind of ['sets', 'minifigs'] as const) {
      const [row] = await db
        .from(kind)
        .whereNotNull('img_url')
        .whereNull('img_url_manual')
        .count('* as total')
      total += Number(row.total)
    }
    return total
  }

  /**
   * Checks up to `limit` pictures (all of them with `all`). `onProgress` is
   * called regularly, e.g. to keep a background job alive.
   */
  static async run(
    options: {
      limit?: number
      all?: boolean
      onProgress?: (stats: ImageCheckStats) => Promise<void> | void
    } = {}
  ): Promise<ImageCheckStats> {
    const limit = options.limit ?? Number.MAX_SAFE_INTEGER
    const candidates = await this.candidates(limit, options.all)
    const stats: ImageCheckStats = { checked: 0, broken: 0, unknown: 0, total: candidates.length }

    let next = 0
    const worker = async () => {
      while (next < candidates.length) {
        const candidate = candidates[next++]
        const state = await this.checkUrl(candidate.url)
        await this.#save(candidate, state)
        stats.checked++
        if (state === 'broken') stats.broken++
        if (state === 'unknown') stats.unknown++
        if (options.onProgress && stats.checked % 100 === 0) await options.onProgress({ ...stats })
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker))
    if (options.onProgress) await options.onProgress({ ...stats })
    return stats
  }

  static async #save(candidate: Candidate, state: ImageState) {
    if (state === 'unknown') return
    const now = DateTime.now().toFormat(SQL_DATETIME)
    await db
      .from(candidate.kind)
      .where('id', candidate.id)
      .update(
        state === 'ok'
          ? { img_checked_at: now, img_broken_at: null }
          : { img_checked_at: now, img_broken_at: db.raw('COALESCE(`img_broken_at`, ?)', [now]) }
      )
  }

  /** Figures for the back office */
  static async summary() {
    const before = DateTime.now().minus(RECHECK_AFTER).toFormat(SQL_DATETIME)
    let total = 0
    let checked = 0
    let lastCheck: string | null = null
    for (const kind of ['sets', 'minifigs'] as const) {
      const [row] = await db
        .from(kind)
        .whereNotNull('img_url')
        .whereNull('img_url_manual')
        .select(
          db.raw('COUNT(*) AS total'),
          db.raw('SUM(`img_checked_at` >= ?) AS checked', [before]),
          db.raw('MAX(`img_checked_at`) AS last_check')
        )
      total += Number(row.total)
      checked += Number(row.checked ?? 0)
      const last = row.last_check ? new Date(row.last_check).toISOString() : null
      if (last && (!lastCheck || last > lastCheck)) lastCheck = last
    }
    return { total, checked, lastCheck }
  }
}
