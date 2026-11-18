import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'
import LogTransport from '#mails/log_transport'

const smtpUser = env.get('SMTP_USERNAME')

const mailConfig = defineConfig({
  default: env.get('MAIL_MAILER'),

  from: {
    address: env.get('MAIL_FROM_ADDRESS'),
    name: env.get('MAIL_FROM_NAME'),
  },

  globals: {
    brandName: 'Bricothèque',
  },

  mailers: {
    /**
     * Development: emails are written to tmp/mails instead of being sent
     */
    log: () => new LogTransport(app.tmpPath('mails')),

    /**
     * Production: SMTP server of the host (o2switch: port 465, TLS)
     */
    smtp: transports.smtp({
      host: env.get('SMTP_HOST') ?? 'localhost',
      port: env.get('SMTP_PORT') ?? 465,
      secure: (env.get('SMTP_PORT') ?? 465) === 465,
      ...(smtpUser
        ? {
            auth: {
              type: 'login' as const,
              user: smtpUser,
              pass: env.get('SMTP_PASSWORD')?.release() ?? '',
            },
          }
        : {}),
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
