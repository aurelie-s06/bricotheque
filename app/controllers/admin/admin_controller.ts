import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

const count = async (query: ReturnType<typeof db.from>) => {
  const [row] = await query.count('* as total')
  return Number(row.total)
}

/**
 * Back office: dashboard and users.
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
      },
      lastUpdate: lastUpdate?.finishedAt ? new Date(lastUpdate.finishedAt).toISOString() : null,
    })
  }

  /** GET /admin/utilisateurs */
  async users({ inertia, request }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)) || 1)
    const result = await db
      .from('users')
      .leftJoin('user_sets', (join) => {
        join.on('user_sets.user_id', 'users.id').andOnVal('user_sets.status', 'owned')
      })
      .groupBy('users.id', 'users.username', 'users.email', 'users.created_at', 'users.is_admin')
      .orderBy('users.created_at', 'desc')
      .select('users.id', 'users.username', 'users.email', 'users.created_at', 'users.is_admin')
      .count('user_sets.id as sets')
      .paginate(page, 50)

    return inertia.render('admin/users', {
      users: result.all().map((row) => ({
        id: Number(row.id),
        username: String(row.username),
        email: String(row.email),
        createdAt: new Date(row.created_at).toISOString().slice(0, 10),
        isAdmin: Boolean(row.is_admin),
        sets: Number(row.sets),
      })),
      pagination: {
        currentPage: result.currentPage,
        lastPage: result.lastPage,
        total: result.total,
        perPage: result.perPage,
      },
    })
  }
}
