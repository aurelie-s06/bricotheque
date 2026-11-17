import { BaseMail } from '@adonisjs/mail'
import type { Locale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'
import { legalInfo } from '#helpers/legal'

export type NoticeContent = {
  subject: string
  greeting: string
  paragraphs: string[]
  button?: { label: string; url: string }
  /** Small print under the button (link validity, "ignore this email"…) */
  notes?: string[]
}

/**
 * Account email (confirmation, password reset, security alerts) in the
 * visitor's language, as HTML and plain text. Every email ends with a way
 * to contact the site (Opquast rule 111).
 */
export default class NoticeMail extends BaseMail {
  constructor(
    protected recipient: string,
    protected locale: Locale,
    protected content: NoticeContent
  ) {
    super()
  }

  prepare() {
    const contactUrl = `${legalInfo().siteUrl.replace(/\/$/, '')}/a-propos#contact`
    const footer = serverMessage(this.locale, 'mail.footer', { url: contactUrl })
    const { subject, greeting, paragraphs, button, notes = [] } = this.content

    this.message
      .to(this.recipient)
      .subject(subject)
      .htmlView('emails/notice', {
        locale: this.locale,
        subject,
        greeting,
        paragraphs,
        button,
        notes,
        footer,
        contactUrl,
      })
      .text(
        [
          greeting,
          '',
          ...paragraphs,
          ...(button ? ['', `${button.label} : ${button.url}`] : []),
          '',
          ...notes,
          '',
          '--',
          footer,
        ].join('\n')
      )
  }
}
