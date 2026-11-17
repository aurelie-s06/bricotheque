import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import User from '#models/user'
import PasswordReset from '#services/password_reset'
import ResetPasswordNotification from '#mails/reset_password_notification'
import { forgotPasswordValidator, resetPasswordValidator } from '#validators/user'
import { validationMessages } from '#validators/messages'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'

export default class PasswordResetController {
  /** GET /mot-de-passe-oublie */
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/forgot_password', {})
  }

  /**
   * POST /mot-de-passe-oublie: sends a reset link if the account exists.
   * The answer is the same either way, so it does not reveal who has an account.
   */
  async store({ request, response, session }: HttpContext) {
    const locale = resolveLocale(request)
    const { email } = await request.validateUsing(forgotPasswordValidator, {
      messagesProvider: validationMessages(locale),
    })

    const user = await User.findBy('email', email)
    if (user) {
      const token = await PasswordReset.createToken(user)
      const resetUrl = `${env.get('APP_URL')}/mot-de-passe/reinitialiser/${token}`
      await mail.send(new ResetPasswordNotification(user, resetUrl, locale))
    }

    session.flash('success', serverMessage(locale, 'password.resetSent'))
    return response.redirect().back()
  }

  /** GET /mot-de-passe/reinitialiser/:token */
  async edit({ params, inertia }: HttpContext) {
    const user = await PasswordReset.findUser(String(params.token))
    return inertia.render('auth/reset_password', { token: String(params.token), valid: !!user })
  }

  /** POST /mot-de-passe/reinitialiser/:token */
  async update({ params, request, response, session }: HttpContext) {
    const locale = resolveLocale(request)
    const user = await PasswordReset.findUser(String(params.token))
    if (!user) {
      session.flash('error', serverMessage(locale, 'password.resetInvalid'))
      return response.redirect().toRoute('password.forgot')
    }

    const { password } = await request.validateUsing(resetPasswordValidator, {
      messagesProvider: validationMessages(locale),
    })
    user.password = password
    // The link came by email: the address is confirmed
    user.emailVerifiedAt ??= DateTime.now()
    await user.save()
    await PasswordReset.consumeAll(user)

    session.flash('success', serverMessage(locale, 'password.resetDone'))
    session.flash('email', user.email) // pre-filled on the login page
    return response.redirect().toRoute('session.create')
  }
}
