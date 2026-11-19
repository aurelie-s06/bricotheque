import type { HttpContext } from '@adonisjs/core/http'
import mail from '@adonisjs/mail/services/main'
import SiteHealth, { LOGS, type LogName } from '#services/admin/site_health'
import { TestMail } from '#mails/account_mails'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'

const logName = (value: unknown): LogName | null =>
  typeof value === 'string' && value in LOGS ? (value as LogName) : null

/** First line of an error, without anything that looks like a password */
const shortError = (error: unknown) =>
  (error instanceof Error ? error.message : String(error)).split('\n')[0].slice(0, 200)

/**
 * Back office: health of the site (cron task, updates, database, Brickset,
 * emails) and the logs of the cron tasks.
 */
export default class HealthController {
  /** GET /admin/sante?tout=1 (shows the idle lines of the logs too) */
  async index({ inertia, request }: HttpContext) {
    const showIdle = request.input('tout') === '1'
    return inertia.render('admin/health', {
      showIdle,
      cron: await SiteHealth.cron(),
      imports: await SiteHealth.imports(),
      database: await SiteHealth.database(),
      environment: SiteHealth.environment(),
      logs: [
        await SiteHealth.readLog('jobs', { showIdle }),
        await SiteHealth.readLog('sync', { showIdle }),
      ],
    })
  }

  /** POST /admin/sante/brickset: asks Brickset how many calls were used today */
  async brickset({ request, session, response }: HttpContext) {
    const locale = resolveLocale(request)
    try {
      const { used, limit } = await SiteHealth.bricksetCallsToday()
      session.flash(
        used >= limit ? 'error' : 'info',
        serverMessage(locale, 'admin.health.quota', {
          used,
          limit,
          left: Math.max(0, limit - used),
        })
      )
    } catch (error) {
      session.flash(
        'error',
        serverMessage(locale, 'admin.health.bricksetFailed', { error: shortError(error) })
      )
    }
    return response.redirect().toRoute('admin.health')
  }

  /** POST /admin/sante/email: sends a test email to the administrator */
  async email({ auth, request, session, response }: HttpContext) {
    const locale = resolveLocale(request)
    const user = auth.getUserOrFail()
    try {
      await mail.send(new TestMail(user, locale))
      session.flash(
        'success',
        serverMessage(locale, 'admin.health.mailSent', { email: user.email })
      )
    } catch (error) {
      session.flash(
        'error',
        serverMessage(locale, 'admin.health.mailFailed', { error: shortError(error) })
      )
    }
    return response.redirect().toRoute('admin.health')
  }

  /** POST /admin/sante/journaux/:name/vider */
  async clearLog({ params, request, session, response }: HttpContext) {
    const locale = resolveLocale(request)
    const name = logName(params.name)
    if (name) {
      await SiteHealth.clearLog(name)
      session.flash(
        'success',
        serverMessage(locale, 'admin.health.logCleared', { file: LOGS[name] })
      )
    }
    return response.redirect().toRoute('admin.health')
  }
}
