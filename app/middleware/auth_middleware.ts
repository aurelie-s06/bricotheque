import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import { INTENDED_URL_KEY } from '#controllers/session_controller'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'

/**
 * Private pages: visitors who are not logged in are sent to the login
 * page, which then brings them back to the page they wanted.
 */
export default class AuthMiddleware {
  redirectTo = '/connexion'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    const guards = options.guards ?? [ctx.auth.defaultGuard]
    for (const guard of guards) {
      if (await ctx.auth.use(guard).check()) {
        return next()
      }
    }

    // Not logged in: remember the page, then ask to log in (with a
    // translated notification instead of a generic error)
    if (ctx.request.method() === 'GET') {
      ctx.session.put(INTENDED_URL_KEY, ctx.request.url(true))
    }
    ctx.session.flash('info', serverMessage(resolveLocale(ctx.request), 'auth.loginRequired'))
    return ctx.response.redirect(this.redirectTo)
  }
}
