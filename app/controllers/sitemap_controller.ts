import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'
import ThemeTree from '#services/catalogue/theme_tree'
import { minifigPath, setPath, themePath } from '#helpers/urls'

/** Public pages listed in the sitemap (private areas are left out) */
export const PUBLIC_PAGES = [
  '/',
  '/sets',
  '/minifigs',
  '/themes',
  '/nouveautes',
  '/a-propos',
  '/plan-du-site',
  '/mentions-legales',
  '/confidentialite',
  '/conditions-utilisation',
]

const SITEMAPS = ['pages', 'themes', 'sets', 'minifigs'] as const
type SitemapName = (typeof SITEMAPS)[number]

const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const day = (value: Date | string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : null

/**
 * robots.txt and sitemaps of the public catalogue (Opquast rules 219 and 220).
 */
export default class SitemapController {
  #base() {
    return env.get('APP_URL').replace(/\/$/, '')
  }

  /** GET /robots.txt */
  async robots({ response }: HttpContext) {
    response.header('Content-Type', 'text/plain; charset=utf-8')
    return [
      'User-agent: *',
      'Disallow: /mon-compte',
      'Disallow: /ma-collection',
      'Disallow: /ma-wishlist',
      'Disallow: /tableau-de-bord',
      'Disallow: /wishlist/',
      'Disallow: /collection/',
      'Disallow: /langue/',
      'Disallow: /recherche',
      'Disallow: /mot-de-passe',
      '',
      `Sitemap: ${this.#base()}/sitemap.xml`,
      '',
    ].join('\n')
  }

  /** GET /sitemap.xml: index of the sitemaps */
  async index({ response }: HttpContext) {
    const items = SITEMAPS.map(
      (name) => `  <sitemap><loc>${this.#base()}/sitemaps/${name}.xml</loc></sitemap>`
    )
    response.header('Content-Type', 'application/xml; charset=utf-8')
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...items,
      '</sitemapindex>',
      '',
    ].join('\n')
  }

  /** GET /sitemaps/:name.xml */
  async show({ params, response }: HttpContext) {
    const name = String(params.name) as SitemapName
    if (!SITEMAPS.includes(name)) {
      return response.notFound('Not found')
    }

    const entries = await this.#entries(name)
    const urls = entries.map(({ path, lastmod }) =>
      [
        '  <url>',
        `    <loc>${escapeXml(this.#base() + path)}</loc>`,
        ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
        '  </url>',
      ].join('\n')
    )
    response.header('Content-Type', 'application/xml; charset=utf-8')
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls,
      '</urlset>',
      '',
    ].join('\n')
  }

  async #entries(name: SitemapName): Promise<{ path: string; lastmod: string | null }[]> {
    switch (name) {
      case 'pages': {
        // The news of the last 12 months, after the main pages
        const months = Array.from({ length: 12 }, (_, index) =>
          DateTime.utc()
            .startOf('month')
            .minus({ months: index + 1 })
            .toFormat('yyyy-LL')
        )
        return [...PUBLIC_PAGES, ...months.map((month) => `/nouveautes/${month}`)].map((path) => ({
          path,
          lastmod: null,
        }))
      }
      case 'themes': {
        const themes = await ThemeTree.load()
        const counts = await themes.setCounts()
        return [...themes.byId.values()]
          .filter((theme) => (counts.get(theme.id) ?? 0) > 0)
          .map((theme) => ({ path: themePath(theme), lastmod: null }))
      }
      case 'sets': {
        const rows = await db
          .from('sets')
          .select('set_num', 'slug', 'updated_at')
          .orderBy('set_num')
        return rows.map((row) => ({
          path: setPath({ setNum: row.set_num, slug: row.slug }),
          lastmod: day(row.updated_at),
        }))
      }
      case 'minifigs': {
        const rows = await db
          .from('minifigs')
          .select('fig_num', 'slug', 'updated_at')
          .orderBy('fig_num')
        return rows.map((row) => ({
          path: minifigPath({ figNum: row.fig_num, slug: row.slug }),
          lastmod: day(row.updated_at),
        }))
      }
    }
  }
}
