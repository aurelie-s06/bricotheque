import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Exception } from '@adonisjs/core/exceptions'

/**
 * Back office: only for administrators. Everyone else gets a 404, so the
 * pages do not even reveal that they exist. Runs after the auth middleware.
 */
export default class AdminMiddleware {
  async handle({ auth }: HttpContext, next: NextFn) {
    if (!auth.user?.isAdmin) {
      throw new Exception('Page introuvable', { status: 404, code: 'E_ROUTE_NOT_FOUND' })
    }
    return next()
  }
}
