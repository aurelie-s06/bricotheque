import { DateTime } from 'luxon'
import type User from '#models/user'
import type { Locale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'
import NoticeMail from '#mails/notice_mail'

type Key = Parameters<typeof serverMessage>[1]
const translator =
  (locale: Locale) =>
  (key: Key, params: Record<string, string> = {}) =>
    serverMessage(locale, key, params)

/** Link to activate a new account (sent at signup and on request) */
export class ConfirmEmailMail extends NoticeMail {
  constructor(user: User, confirmUrl: string, locale: Locale) {
    const t = translator(locale)
    super(user.email, locale, {
      subject: t('mail.confirmSubject'),
      greeting: t('mail.resetGreeting', { username: user.username }),
      paragraphs: [t('mail.confirmIntro')],
      button: { label: t('mail.confirmButton'), url: confirmUrl },
      notes: [t('mail.confirmExpiry'), t('mail.confirmIgnore')],
    })
  }
}

/**
 * Sent instead of a confirmation when someone signs up with an address that
 * already has an account: the page does not reveal it (Opquast rule 26).
 */
export class AccountExistsMail extends NoticeMail {
  constructor(user: User, loginUrl: string, forgotUrl: string, locale: Locale) {
    const t = translator(locale)
    super(user.email, locale, {
      subject: t('mail.existsSubject'),
      greeting: t('mail.resetGreeting', { username: user.username }),
      paragraphs: [t('mail.existsIntro'), t('mail.existsForgot', { url: forgotUrl })],
      button: { label: t('mail.existsButton'), url: loginUrl },
      notes: [t('mail.existsIgnore')],
    })
  }
}

/** Security alerts after a password or email change (Opquast rule 19) */
export class SecurityAlertMail extends NoticeMail {
  constructor(
    recipient: string,
    user: User,
    change: 'password' | 'email',
    forgotUrl: string,
    locale: Locale
  ) {
    const t = translator(locale)
    const date = DateTime.now()
      .setLocale(locale === 'fr' ? 'fr-FR' : 'en-GB')
      .toLocaleString(DateTime.DATETIME_FULL)
    super(recipient, locale, {
      subject: t(
        change === 'password' ? 'mail.passwordChangedSubject' : 'mail.emailChangedSubject'
      ),
      greeting: t('mail.resetGreeting', { username: user.username }),
      paragraphs: [
        change === 'password'
          ? t('mail.passwordChangedIntro', { date })
          : t('mail.emailChangedIntro', { date, email: user.email }),
        t('mail.notYou', { url: forgotUrl }),
      ],
    })
  }
}

/** Sent from the back office to check that the emails leave the server */
export class TestMail extends NoticeMail {
  constructor(user: User, locale: Locale) {
    const t = translator(locale)
    super(user.email, locale, {
      subject: t('mail.testSubject'),
      greeting: t('mail.resetGreeting', { username: user.username }),
      paragraphs: [t('mail.testIntro')],
    })
  }
}

export type AlertedSet = { setNum: string; name: string; url: string; date: string | null }

/** "26/11/2026" or "11/26/2026": dates of the emails, written in full */
const mailDate = (date: string | null, locale: Locale) =>
  date
    ? new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${date}T12:00:00Z`))
    : '–'

const setLine = (set: AlertedSet) => `${set.setNum.replace(/-1$/, '')} ${set.name}`

/** Sets of the wishlist that came out, or leave the shops soon */
export class WishlistAlertMail extends NoticeMail {
  constructor(
    user: User,
    locale: Locale,
    data: {
      released: AlertedSet[]
      retiring: AlertedSet[]
      wishlistUrl: string
      unsubscribeUrl: string
    }
  ) {
    const t = translator(locale)
    const paragraphs: string[] = []
    if (data.released.length) {
      paragraphs.push(t('mail.alertReleased'))
      for (const set of data.released) {
        paragraphs.push(
          `• ${setLine(set)} – ${t('mail.alertSince', { date: mailDate(set.date, locale) })} : ${set.url}`
        )
      }
    }
    if (data.retiring.length) {
      paragraphs.push(t('mail.alertRetiring'))
      for (const set of data.retiring) {
        paragraphs.push(
          `• ${setLine(set)} – ${t('mail.alertUntil', { date: mailDate(set.date, locale) })} : ${set.url}`
        )
      }
    }
    super(user.email, locale, {
      subject: t('mail.alertSubject'),
      greeting: t('mail.resetGreeting', { username: user.username }),
      paragraphs,
      button: { label: t('mail.alertButton'), url: data.wishlistUrl },
      notes: [t('mail.alertUnsubscribe', { url: data.unsubscribeUrl })],
    })
  }
}
