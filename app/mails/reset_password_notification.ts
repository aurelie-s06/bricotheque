import type User from '#models/user'
import type { Locale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'
import NoticeMail from '#mails/notice_mail'

/**
 * "Forgot password" email, in the language the visitor was using.
 */
export default class ResetPasswordNotification extends NoticeMail {
  constructor(user: User, resetUrl: string, locale: Locale) {
    const t = (key: Parameters<typeof serverMessage>[1], params = {}) =>
      serverMessage(locale, key, params)
    super(user.email, locale, {
      subject: t('mail.resetSubject'),
      greeting: t('mail.resetGreeting', { username: user.username }),
      paragraphs: [t('mail.resetIntro')],
      button: { label: t('mail.resetButton'), url: resetUrl },
      notes: [t('mail.resetExpiry'), t('mail.resetIgnore')],
    })
  }
}
