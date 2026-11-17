import type { HttpContext } from '@adonisjs/core/http'

/**
 * Goes back to the form with errors: per field, or for the whole form
 * under the "form" key (shown at the top of the form).
 */
export function backWithErrors(ctx: HttpContext, errors: Record<string, string>) {
  ctx.session.flash('inputErrorsBag', errors)
  return ctx.response.redirect().back()
}
