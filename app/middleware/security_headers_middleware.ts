import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Security headers that Shield does not send (Opquast rules 25 and 210):
 * referrer policy and XSS protection. Shield sends the others (CSP,
 * X-Frame-Options, HSTS, nosniff).
 */
export default class SecurityHeadersMiddleware {
  handle({ response }: HttpContext, next: NextFn) {
    response.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.header('X-XSS-Protection', '1; mode=block')
    return next()
  }
}
