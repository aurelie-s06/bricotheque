import { BaseMail } from '@adonisjs/mail'
import type User from '#models/user'
import type { Locale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'

/**
 * "Forgot password" email, in the language the visitor was using.
 */
export default class ResetPasswordNotification extends BaseMail {
  constructor(
    private user: User,
    private resetUrl: string,
    private locale: Locale
  ) {
    super()
  }

  prepare() {
    const t = (key: Parameters<typeof serverMessage>[1], params = {}) =>
      serverMessage(this.locale, key, params)
    const texts = {
      greeting: t('mail.resetGreeting', { username: this.user.username }),
      intro: t('mail.resetIntro'),
      button: t('mail.resetButton'),
      expiry: t('mail.resetExpiry'),
      ignore: t('mail.resetIgnore'),
    }

    this.message
      .to(this.user.email)
      .subject(t('mail.resetSubject'))
      .htmlView('emails/reset_password', { locale: this.locale, resetUrl: this.resetUrl, texts })
      .text(
        [texts.greeting, '', texts.intro, this.resetUrl, '', texts.expiry, texts.ignore].join('\n')
      )
  }
}
