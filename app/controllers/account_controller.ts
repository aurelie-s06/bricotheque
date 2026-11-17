import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import {
  deleteAccountValidator,
  updatePasswordValidator,
  updateProfileValidator,
} from '#validators/user'
import { validationMessages } from '#validators/messages'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'
import { backWithErrors } from '#helpers/form_errors'

export default class AccountController {
  /** GET /mon-compte */
  async show({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    return inertia.render('account/show', {
      account: {
        username: user.username,
        email: user.email,
        createdAt: user.createdAt.toISODate()!,
      },
    })
  }

  /**
   * PUT /mon-compte/profil: username and email. Changing the email
   * requires the current password.
   */
  async updateProfile(ctx: HttpContext) {
    const { request, auth, session, response } = ctx
    const user = auth.getUserOrFail()
    const locale = resolveLocale(request)
    const data = await request.validateUsing(updateProfileValidator, {
      meta: { userId: user.id },
      messagesProvider: validationMessages(locale),
    })

    if (data.email !== user.email) {
      if (!data.currentPassword) {
        return backWithErrors(ctx, {
          currentPassword: serverMessage(locale, 'account.currentPasswordRequired'),
        })
      }
      if (!(await hash.verify(user.password, data.currentPassword))) {
        return backWithErrors(ctx, {
          currentPassword: serverMessage(locale, 'account.wrongPassword'),
        })
      }
    }

    user.merge({ username: data.username, email: data.email })
    await user.save()
    session.flash('success', serverMessage(locale, 'account.profileUpdated'))
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
