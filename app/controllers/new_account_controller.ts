import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import User from '#models/user'
import EmailVerification from '#services/email_verification'
import { AccountExistsMail } from '#mails/account_mails'
import { forgotPasswordValidator, signupValidator } from '#validators/user'
import { validationMessages } from '#validators/messages'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'

/** Session key of the address the confirmation was sent to (for the page) */
const PENDING_EMAIL_KEY = 'signup.email'

export default class NewAccountController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/signup', {})
  }

  /**
   * Creates the account (not activated yet) and sends the confirmation
   * link. If the address already has an account, its owner gets an email
   * instead: the answer is the same, so the page does not reveal who has
   * an account (Opquast rule 26).
   */
  async store({ request, response, session }: HttpContext) {
    const locale = resolveLocale(request)
    const { username, email, password } = await request.validateUsing(signupValidator, {
      messagesProvider: validationMessages(locale),
    })

    const existing = await User.findBy('email', email)
    if (existing) {
      const base = env.get('APP_URL').replace(/\/$/, '')
      await mail.send(
        new AccountExistsMail(existing, `${base}/connexion`, `${base}/mot-de-passe-oublie`, locale)
      )
    } else {
      const user = await User.create({ username, email, password })
      await EmailVerification.send(user, locale)
    }

    session.put(PENDING_EMAIL_KEY, email)
    session.flash('success', serverMessage(locale, 'auth.checkEmail', { email }))
    return response.redirect().toRoute('email.pending')
  }

  /** GET /inscription/confirmation: "check your inbox" page, with a resend form */
  async pending({ inertia, session }: HttpContext) {
    const email = session.get(PENDING_EMAIL_KEY) as string | undefined
    return inertia.render('auth/check_email', { email: email ?? '' })
  }

  /** GET /inscription/confirmer/:id (signed link from the email) */
  async verify({ params, request, response, session, auth }: HttpContext) {
    const locale = resolveLocale(request)
    const user = await User.find(params.id)
    if (!user || !EmailVerification.isValid(request, user)) {
      session.flash('error', serverMessage(locale, 'auth.verifyInvalid'))
      return response.redirect().clearQs().toRoute('email.pending')
    }

    if (!user.emailVerifiedAt) {
      await EmailVerification.markVerified(user)
    }
    session.forget(PENDING_EMAIL_KEY)
    await auth.use('web').login(user)
    session.flash('success', serverMessage(locale, 'auth.verified', { username: user.username }))
    return response.redirect().clearQs().toRoute('account.show')
  }

  /** POST /inscription/renvoyer: new confirmation link, same answer for every address */
  async resend({ request, response, session }: HttpContext) {
    const locale = resolveLocale(request)
    const { email } = await request.validateUsing(forgotPasswordValidator, {
      messagesProvider: validationMessages(locale),
    })

    const user = await User.findBy('email', email)
    if (user && !user.emailVerifiedAt) {
      await EmailVerification.send(user, locale)
    }
    session.flash('success', serverMessage(locale, 'auth.verificationResent'))
    return response.redirect().toRoute('email.pending')
  }
}
