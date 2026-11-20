import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { catalogueVersion } from '#services/catalogue/catalogue_version'
import type ThemeTree from '#services/catalogue/theme_tree'

/** The picture of a theme is its biggest set of its last years */
const RECENT_YEARS = 5
/** Pictures change once a night: kept in memory for a while */
const CACHE_MS = 6 * 60 * 60 * 1000

let cached: { at: number; version: string; value: Map<number, string> } | null = null

/**
 * One picture per main theme (for the themes gallery): the biggest set of
 * the last years of the theme, subthemes included. Computed for all the
 * themes with a single query.
 */
export default class ThemePictures {
  static async get(themes: ThemeTree): Promise<Map<number, string>> {
    // Rebuilt after its delay, or as soon as an import has finished
    const version = await catalogueVersion()
    if (!app.inTest && cached && cached.version === version && Date.now() - cached.at < CACHE_MS) {
      return cached.value
    }
    const value = await this.#build(themes)
    cached = { at: Date.now(), version, value }
    return value
  }

  static async #build(themes: ThemeTree) {
    const rows: { theme_id: number; img_url: string; num_parts: number; year: number | null }[] =
      await db
        .from('sets')
        .where('kind', 'set')
        .whereNotNull('img_url')
        .whereNull('img_broken_at')
        .where((query) => query.whereNull('year').orWhere('year', '<=', DateTime.utc().year))
        .select('theme_id', 'img_url', 'num_parts', 'year')

    // Per main theme: its latest year, then the biggest set of its last years
    const byRoot = new Map<number, typeof rows>()
    for (const row of rows) {
      const root = themes.ancestorsOf(row.theme_id)[0]
      if (!root) continue
      const list = byRoot.get(root.id) ?? []
      list.push(row)
      byRoot.set(root.id, list)
    }
    const pictures = new Map<number, string>()
    for (const [rootId, list] of byRoot) {
      const lastYear = Math.max(...list.map((row) => row.year ?? 0))
      const recent = list.filter((row) => (row.year ?? 0) > lastYear - RECENT_YEARS)
      const best = (recent.length ? recent : list).reduce((a, b) =>
        b.num_parts > a.num_parts ? b : a
      )
      pictures.set(rootId, best.img_url)
    }
    return pictures
  }
}
