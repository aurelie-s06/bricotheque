import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import ThemeTree from '#services/catalogue/theme_tree'
import { HOST_INFO, legalInfo } from '#helpers/legal'
import { themePath } from '#helpers/urls'

/**
 * Information pages: about, legal notice, privacy, terms of use and site map.
 */
export default class PagesController {
  /** GET /a-propos */
  async about({ inertia }: HttpContext) {
    const lastImports = await db
      .from('import_runs')
      .where('status', 'completed')
      .whereIn('source', ['rebrickable', 'brickset'])
      .groupBy('source')
      .select('source')
      .max('finished_at as finishedAt')
    const updatedAt = (source: string) => {
      const row = lastImports.find((entry) => entry.source === source)
      return row?.finishedAt ? new Date(row.finishedAt).toISOString().slice(0, 10) : null
    }

    return inertia.render('pages/about', {
      contact: legalInfo(),
      catalogueUpdates: { rebrickable: updatedAt('rebrickable'), brickset: updatedAt('brickset') },
    })
  }

  /** GET /mentions-legales */
  async legal({ inertia }: HttpContext) {
    return inertia.render('pages/legal', { contact: legalInfo(), host: HOST_INFO })
  }

  /** GET /confidentialite */
  async privacy({ inertia }: HttpContext) {
    return inertia.render('pages/privacy', { contact: legalInfo(), host: HOST_INFO })
  }

  /** GET /conditions-utilisation */
  async terms({ inertia }: HttpContext) {
    return inertia.render('pages/terms', { contact: legalInfo() })
  }

  /** GET /plan-du-site */
  async siteMap({ inertia }: HttpContext) {
    const themes = await ThemeTree.load()
    const counts = await themes.setCounts()
    return inertia.render('pages/site_map', {
      themes: themes
        .roots()
        .filter((root) => (counts.get(root.id) ?? 0) > 0)
        .map((root) => ({ name: root.name, url: themePath(root) })),
    })
  }
}
