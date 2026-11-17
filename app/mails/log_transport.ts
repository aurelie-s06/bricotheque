import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { MailResponse } from '@adonisjs/mail'
import type { MailTransportContract, NodeMailerMessage } from '@adonisjs/mail/types'
import logger from '@adonisjs/core/services/logger'

function addresses(value: unknown): string {
  if (!value) return ''
  const list = Array.isArray(value) ? value : [value]
  return list
    .map((entry) => (typeof entry === 'string' ? entry : (entry as { address: string }).address))
    .join(', ')
}

/**
 * Development transport: the email is not sent but written as an HTML
 * file in tmp/mails, and its path is logged (open it in a browser).
 */
export default class LogTransport implements MailTransportContract {
  constructor(private directory: string) {}

  async send(message: NodeMailerMessage) {
    await mkdir(this.directory, { recursive: true })
    const to = addresses(message.to)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const file = join(this.directory, `${stamp}.html`)
    const header = `<!-- To: ${to} | Subject: ${message.subject ?? ''} -->\n`
    await writeFile(file, header + String(message.html ?? message.text ?? ''))

    logger.info({ to, subject: message.subject, file }, 'Email written to %s', file)
    const messageId = `log-${stamp}`
    return new MailResponse(messageId, { from: addresses(message.from), to: [to] }, { file })
  }
}
