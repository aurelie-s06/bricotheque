import type { HttpContext } from '@adonisjs/core/http'
import Collection from '#services/collection'
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
        wishlistAlerts: user.wishlistAlerts,
      },
      /** Minifigs of the owned sets not in the collection yet */
      missingMinifigs: await new Collection(user).countMissingMinifigsOfOwnedSets(),
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
    user.wishlistAlerts = data.wishlistAlerts ?? false
    // The member chose: no need to ask any more
    user.minifigPromptAnswered = true
    user.wishlistAlertsPromptAnswered = true
    // Language of the alerts, sent without a visit
    user.locale = locale
    await user.save()
    session.flash('success', serverMessage(locale, 'collection.preferencesSaved'))
    return response.redirect().toRoute('account.show')
  }

  /** POST /mon-compte/minifigs: adds the minifigs of the sets already in the collection */
  async addOwnedMinifigs({ request, auth, session, response }: HttpContext) {
    const count = await new Collection(auth.getUserOrFail()).addMinifigsOfOwnedSets()
    session.flash(
      count > 0 ? 'success' : 'info',
      serverMessage(
        resolveLocale(request),
        count > 0 ? 'collection.ownedMinifigsAdded' : 'collection.noMissingMinifigs',
        { count }
      )
    )
    return response.redirect().back()
  }

  /**
   * POST /mon-compte/minifigs/proposition (answer=yes|no): answer to the
   * question asked after the first set. "yes" turns the option on and adds
   * the minifigs of the sets already there.
   */
  async answerMinifigPrompt({ request, auth, session, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const locale = resolveLocale(request)
    const yes = request.input('answer') === 'yes'
    user.minifigPromptAnswered = true
    if (yes) user.autoAddMinifigs = true
    await user.save()
    if (yes) {
      const count = await new Collection(user).addMinifigsOfOwnedSets()
      session.flash('success', serverMessage(locale, 'collection.autoMinifigsOn', { count }))
    } else {
      session.flash('info', serverMessage(locale, 'collection.autoMinifigsOff'))
    }
    return response.redirect().back()
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
