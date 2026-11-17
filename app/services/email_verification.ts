import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'
import env from '#start/env'
import type User from '#models/user'
import type { Locale } from '#helpers/locale'
import { ConfirmEmailMail } from '#mails/account_mails'

const PURPOSE = 'email-verification'

/**
 * Confirmation of the email address at signup (Opquast rule 18): a signed
 * link valid 24 hours, tied to the address it was sent to.
 */
export default class EmailVerification {
  static url(user: User) {
    const path = signedUrlFor(
      'email.verify',
      { id: user.id },
      { expiresIn: '24h', purpose: PURPOSE, qs: { email: user.email } }
    )
    return `${env.get('APP_URL').replace(/\/$/, '')}${path}`
  }

  static async send(user: User, locale: Locale) {
    await mail.send(new ConfirmEmailMail(user, this.url(user), locale))
  }

  /** The link is valid and was sent to the current address of the account */
  static isValid(
    request: { hasValidSignature(purpose?: string): boolean; qs(): Record<string, any> },
    user: User
  ) {
    return request.hasValidSignature(PURPOSE) && request.qs().email === user.email
  }

  static async markVerified(user: User) {
    user.emailVerifiedAt = DateTime.now()
    await user.save()
  }
}
