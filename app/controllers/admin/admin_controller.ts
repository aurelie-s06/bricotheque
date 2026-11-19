import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import ManualItems from '#services/catalogue/manual_items'

const count = async (query: ReturnType<typeof db.from>) => {
  const [row] = await query.count('* as total')
  return Number(row.total)
}

/**
 * Back office: dashboard.
 */
export default class AdminController {
  /** GET /admin */
  async dashboard({ inertia }: HttpContext) {
    const noImage = (table: 'sets' | 'minifigs') =>
      count(
        db
          .from(table)
          .whereNull('img_url_manual')
          .where((query) => query.whereNull('img_url').orWhereNotNull('img_broken_at'))
      )
    const [lastUpdate] = await db
      .from('import_runs')
      .where('status', 'completed')
      .max('finished_at as finishedAt')

    return inertia.render('admin/dashboard', {
      figures: {
        sets: await count(db.from('sets')),
        minifigs: await count(db.from('minifigs')),
        users: await count(db.from('users')),
        setsWithoutImage: await noImage('sets'),
        minifigsWithoutImage: await noImage('minifigs'),
        untranslated: await count(
          db.from('sets').whereNotNull('description').whereNull('description_fr')
        ),
        pendingMerges: await ManualItems.pendingMerges(),
      },
      lastUpdate: lastUpdate?.finishedAt ? new Date(lastUpdate.finishedAt).toISOString() : null,
    })
  }
}
