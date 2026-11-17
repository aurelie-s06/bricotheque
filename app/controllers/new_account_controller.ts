import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { signupValidator } from '#validators/user'
import { validationMessages } from '#validators/messages'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'

export default class NewAccountController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/signup', {})
  }

  /**
   * Creates the account (password hashed by the model) and logs in.
   */
  async store({ request, response, auth, session }: HttpContext) {
    const locale = resolveLocale(request)
    const { username, email, password } = await request.validateUsing(signupValidator, {
      messagesProvider: validationMessages(locale),
    })
    const user = await User.create({ username, email, password })

    await auth.use('web').login(user)
    session.flash('success', serverMessage(locale, 'auth.welcome', { username }))
    return response.redirect().toRoute('account.show')
  }
}
