import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { catalogueVersion } from '#services/catalogue/catalogue_version'
import ThemeTree from '#services/catalogue/theme_tree'
import { themePath } from '#helpers/urls'

/** Themes shown on the home page, and pictures of the mosaic */
const THEMES_SHOWN = 8
const MOSAIC_SIZE = 18
/** A theme is "big" when it had many real sets out in these last years */
const RECENT_YEARS = 3
/** Below this, a set is a polybag, a promotional gift or a key chain */
const MIN_PARTS = 150
/** The figures change once a night: kept in memory for a while */
const CACHE_MS = 6 * 60 * 60 * 1000

export type Showcase = {
  counts: { sets: number; minifigs: number; themes: number }
  mosaic: string[]
  themes: { name: string; url: string; count: number; image: string | null }[]
}

let cached: { at: number; version: string; value: Showcase } | null = null

/**
 * What makes the home page lively: figures of the catalogue, a mosaic of
 * the latest sets and the big themes of the moment with a picture each.
 */
export default class HomeShowcase {
  static async get(): Promise<Showcase> {
    // Fresh figures in the tests, cached figures for the visitors
    // Rebuilt after its delay, or as soon as an import has finished
    const version = await catalogueVersion()
    if (!app.inTest && cached && cached.version === version && Date.now() - cached.at < CACHE_MS) {
      return cached.value
    }
    const value = await this.#build()
    cached = { at: Date.now(), version, value }
    return value
  }

  static clear() {
    cached = null
  }

  static async #build(): Promise<Showcase> {
    const themes = await ThemeTree.load()
    const counts = await themes.setCounts()
    const [sets] = await db.from('sets').where('kind', 'set').count('* as total')
    const [minifigs] = await db.from('minifigs').count('* as total')

    const mosaic: { img_url: string }[] = await db
      .from('sets')
      .where('kind', 'set')
      .whereNotNull('img_url')
      .whereNull('img_broken_at')
      .whereNotNull('date_first_available')
      .where('date_first_available', '<=', DateTime.utc().toISODate()!)
      .orderBy('date_first_available', 'desc')
      .limit(MOSAIC_SIZE)
      .select('img_url')

    return {
      counts: {
        sets: Number(sets.total),
        minifigs: Number(minifigs.total),
        themes: themes.roots().filter((root) => (counts.get(root.id) ?? 0) > 0).length,
      },
      mosaic: mosaic.map((row) => row.img_url),
      themes: await this.#bigThemes(themes, counts),
    }
  }

  /**
   * Root themes with the most real sets out lately (polybags and promotional
   * gifts left out), with the picture of their latest big set
   */
  static async #bigThemes(themes: ThemeTree, counts: Map<number, number>) {
    const since = DateTime.utc().year - RECENT_YEARS + 1
    const rows: { theme_id: number; total: number }[] = await db
      .from('sets')
      .where('kind', 'set')
      .where('year', '>=', since)
      .where('num_parts', '>=', MIN_PARTS)
      .groupBy('theme_id')
      .select('theme_id')
      .count('* as total')

    const recentByRoot = new Map<number, number>()
    for (const row of rows) {
      const root = themes.ancestorsOf(row.theme_id)[0]
      if (root) recentByRoot.set(root.id, (recentByRoot.get(root.id) ?? 0) + Number(row.total))
    }
    const top = [...recentByRoot.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, THEMES_SHOWN)
      .map(([id]) => themes.byId.get(id)!)

    return Promise.all(
      top.map(async (theme) => {
        const latest = await db
          .from('sets')
          .where('kind', 'set')
          .whereIn('theme_id', themes.descendantIds(theme.id))
          .whereNotNull('img_url')
          .whereNull('img_broken_at')
          .where('num_parts', '>=', MIN_PARTS)
          .where('year', '<=', DateTime.utc().year)
          .orderBy('year', 'desc')
          .orderBy('num_parts', 'desc')
          .first()
        return {
          name: theme.name,
          url: themePath(theme),
          count: counts.get(theme.id) ?? 0,
          image: (latest?.img_url as string | undefined) ?? null,
        }
      })
    )
  }
}
