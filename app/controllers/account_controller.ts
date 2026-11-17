import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { preferencesValidator } from '#validators/collection'
import {
  deleteAccountValidator,
  updateEmailValidator,
  updatePasswordValidator,
  updateUsernameValidator,
} from '#validators/user'
import { validationMessages } from '#validators/messages'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'
import { backWithErrors } from '#helpers/form_errors'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import { SecurityAlertMail } from '#mails/account_mails'

const forgotUrl = () => `${env.get('APP_URL').replace(/\/$/, '')}/mot-de-passe-oublie`

export default class AccountController {
  /** GET /mon-compte */
  async show({ inertia, auth, request }: HttpContext) {
    const user = auth.getUserOrFail()
    return inertia.render('account/show', {
      account: {
        username: user.username,
        email: user.email,
        createdAt: user.createdAt.toISODate()!,
        autoAddMinifigs: user.autoAddMinifigs,
      },
      shareUrl: user.wishlistShareToken
        ? `${request.protocol()}://${request.host()}/wishlist/${user.wishlistShareToken}`
        : null,
    })
  }

  /** PUT /mon-compte/pseudo */
  async updateUsername({ request, auth, session, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const locale = resolveLocale(request)
    const data = await request.validateUsing(updateUsernameValidator, {
      meta: { userId: user.id },
      messagesProvider: validationMessages(locale),
    })
    user.username = data.username
    await user.save()
    session.flash('success', serverMessage(locale, 'account.usernameUpdated'))
    return response.redirect().toRoute('account.show')
  }

  /** PUT /mon-compte/email: needs the current password; the old address is warned */
  async updateEmail(ctx: HttpContext) {
    const { request, auth, session, response } = ctx
    const user = auth.getUserOrFail()
    const locale = resolveLocale(request)
    const data = await request.validateUsing(updateEmailValidator, {
      meta: { userId: user.id },
      messagesProvider: validationMessages(locale),
    })

    if (!(await hash.verify(user.password, data.currentPassword))) {
      return backWithErrors(ctx, {
        currentPassword: serverMessage(locale, 'account.wrongPassword'),
      })
    }
    if (data.email === user.email) {
      return response.redirect().toRoute('account.show')
    }

    const previousEmail = user.email
    user.email = data.email
    await user.save()
    // Warn the previous address, in case someone else made the change
    await mail.send(new SecurityAlertMail(previousEmail, user, 'email', forgotUrl(), locale))
    session.flash('success', serverMessage(locale, 'account.emailUpdated'))
    return response.redirect().toRoute('account.show')
  }

  /** PUT /mon-compte/preferences: add the minifigs of a set with the set */
  async updatePreferences({ request, auth, session, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const locale = resolveLocale(request)
    const data = await request.validateUsing(preferencesValidator, {
      messagesProvider: validationMessages(locale),
    })
    user.autoAddMinifigs = data.autoAddMinifigs ?? false
    await user.save()
    session.flash('success', serverMessage(locale, 'collection.preferencesSaved'))
    return response.redirect().toRoute('account.show')
  }

  /** PUT /mon-compte/mot-de-passe */
  async updatePassword(ctx: HttpContext) {
    const { request, auth, session, response } = ctx
    const user = auth.getUserOrFail()
    const locale = resolveLocale(request)
    const data = await request.validateUsing(updatePasswordValidator, {
      messagesProvider: validationMessages(locale),
    })

    if (!(await hash.verify(user.password, data.currentPassword))) {
      return backWithErrors(ctx, {
        currentPassword: serverMessage(locale, 'account.wrongPassword'),
      })
    }

    user.password = data.password
    await user.save()
    await mail.send(new SecurityAlertMail(user.email, user, 'password', forgotUrl(), locale))
    session.flash('success', serverMessage(locale, 'account.passwordUpdated'))
    return response.redirect().toRoute('account.show')
  }

  /**
   * DELETE /mon-compte: confirmed with the password. The collection and
   * the wishlist are deleted with the account (foreign keys in cascade).
   */
  async destroy(ctx: HttpContext) {
    const { request, auth, session, response } = ctx
    const user = auth.getUserOrFail()
    const locale = resolveLocale(request)
    const { password } = await request.validateUsing(deleteAccountValidator, {
      messagesProvider: validationMessages(locale),
    })

    if (!(await hash.verify(user.password, password))) {
      return backWithErrors(ctx, { deletePassword: serverMessage(locale, 'account.wrongPassword') })
    }

    await auth.use('web').logout()
    await user.delete()
    session.flash('success', serverMessage(locale, 'account.deleted'))
    return response.redirect().toRoute('home')
  }
}
