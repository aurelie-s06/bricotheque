import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import WishlistAlerts from '#services/wishlist_alerts'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'

/**
 * Wishlist alerts by email: answer to the question asked once, and the
 * one-click unsubscribe link of the emails (no login needed).
 */
export default class WishlistAlertsController {
  /** GET /alertes-wishlist/desinscription/:id (signed link of the emails) */
  async unsubscribe({ params, request, session, response }: HttpContext) {
    const locale = resolveLocale(request)
    const user = WishlistAlerts.isValidUnsubscribe(request)
      ? await User.find(Number(params.id))
      : null
    if (!user) {
      session.flash('error', serverMessage(locale, 'wishlistAlerts.invalidLink'))
      return response.redirect().toRoute('home')
    }
    user.wishlistAlerts = false
    user.wishlistAlertsPromptAnswered = true
    await user.save()
    session.flash('success', serverMessage(locale, 'wishlistAlerts.unsubscribed'))
    return response.redirect().toRoute('home')
  }

  /** POST /mon-compte/alertes/proposition (answer=yes|no) */
  async answerPrompt({ request, auth, session, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const locale = resolveLocale(request)
    const yes = request.input('answer') === 'yes'
    user.wishlistAlertsPromptAnswered = true
    user.wishlistAlerts = yes
    user.locale = locale
    await user.save()
    session.flash(
      yes ? 'success' : 'info',
      serverMessage(locale, yes ? 'wishlistAlerts.on' : 'wishlistAlerts.off')
    )
    return response.redirect().back()
  }
}
