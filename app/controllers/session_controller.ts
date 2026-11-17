import type { HttpContext } from '@adonisjs/core/http'
import { errors as authErrors } from '@adonisjs/auth'
import limiter from '@adonisjs/limiter/services/main'
import User from '#models/user'
import EmailVerification from '#services/email_verification'
import { loginValidator } from '#validators/user'
import { validationMessages } from '#validators/messages'
import { resolveLocale, safeReturnPath } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'
import { backWithErrors } from '#helpers/form_errors'

/** Session key of the page a visitor wanted before being asked to log in */
export const INTENDED_URL_KEY = 'auth.intended'

/**
 * 5 failed attempts per address and IP in 15 minutes, then 15 minutes
 * of waiting. Successful logins do not count.
 */
const loginLimiter = () =>
  limiter.use({ requests: 5, duration: '15 mins', blockDuration: '15 mins' })

export default class SessionController {
  async create({ inertia, session, request }: HttpContext) {
    // "?retour=/sets/…": buttons of visitors who are not logged in
    const returnTo = request.input('retour')
    if (returnTo && safeReturnPath(returnTo) === returnTo) {
      session.put(INTENDED_URL_KEY, returnTo)
    }
    return inertia.render('auth/login', {
      notice: session.has(INTENDED_URL_KEY)
        ? serverMessage(resolveLocale(request), 'auth.loginRequired')
        : null,
    })
  }

  async store(ctx: HttpContext) {
    const { request, auth, response, session } = ctx
    const locale = resolveLocale(request)
    const { email, password } = await request.validateUsing(loginValidator, {
      messagesProvider: validationMessages(locale),
    })

    let user: User
    try {
      const [throttled, verified] = await loginLimiter().penalize(
        `login_${request.ip()}_${email}`,
        () => User.verifyCredentials(email, password)
      )
      if (throttled) {
        const minutes = Math.max(1, Math.ceil(throttled.response.availableIn / 60))
        return backWithErrors(ctx, {
          form: serverMessage(locale, 'auth.tooManyAttempts', { minutes }),
        })
      }
      user = verified
    } catch (error) {
      if (error instanceof authErrors.E_INVALID_CREDENTIALS) {
        // Same message whether the email exists or not
        return backWithErrors(ctx, { form: serverMessage(locale, 'auth.invalidCredentials') })
      }
      throw error
    }

    // Account not activated yet: send the link again instead of logging in
    if (!user.emailVerifiedAt) {
      await EmailVerification.send(user, locale)
      return backWithErrors(ctx, { form: serverMessage(locale, 'auth.notVerified') })
    }

    await auth.use('web').login(user)
    session.flash('success', serverMessage(locale, 'auth.loggedIn', { username: user.username }))
    return response.redirect().toPath(safeReturnPath(session.pull(INTENDED_URL_KEY)))
  }

  async destroy({ auth, response, session, request }: HttpContext) {
    await auth.use('web').logout()
    session.flash('success', serverMessage(resolveLocale(request), 'auth.loggedOut'))
    return response.redirect().toRoute('home')
  }
}
