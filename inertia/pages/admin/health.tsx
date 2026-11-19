import { type ReactNode } from 'react'
import { Form, Link } from '@adonisjs/inertia/react'
import { CircleAlert, CircleCheck, CircleX } from 'lucide-react'
import AppLayout from '~/layouts/app'
import AdminShell from '~/components/admin_shell'
import { type InertiaProps } from '~/types'
import { useI18n, type MessageKey } from '~/i18n'

type CheckStatus = 'ok' | 'warning' | 'error'

type Log = {
  name: 'jobs' | 'sync'
  exists: boolean
  size: number
  modifiedAt: string | null
  lines: string[]
  hiddenIdle: number
}

type Props = InertiaProps<{
  showIdle: boolean
  cron: { status: CheckStatus; lastRun: string | null }
  imports: {
    status: CheckStatus
    rebrickable: string | null
    brickset: string | null
    lastFailure: { source: string; startedAt: string; error: string } | null
  }
  database: { status: CheckStatus; sizeBytes: number | null }
  environment: {
    node: string
    mode: string
    uptimeSeconds: number
    bricksetKey: boolean
    mailer: string
  }
  logs: Log[]
}>

const ICONS = { ok: CircleCheck, warning: CircleAlert, error: CircleX }

/** One check: an icon and a word for the state (never the color alone) */
function Check({
  id,
  title,
  status,
  children,
}: {
  id: string
  title: string
  status: CheckStatus
  children: ReactNode
}) {
  const { t } = useI18n()
  const Icon = ICONS[status]
  return (
    <section
      className={`card health-check health-check--${status}`}
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`} className="health-check__title">
        <Icon size={22} aria-hidden="true" className="health-check__icon" />
        <span>
          {title}
          <span className="health-check__state">
            {' · '}
            {t(`admin.health.status.${status}` as MessageKey)}
          </span>
        </span>
      </h2>
      {children}
    </section>
  )
}

export default function AdminHealth({
  showIdle,
  cron,
  imports,
  database,
  environment,
  logs,
}: Props) {
  const { t, tc, formatNumber, formatDateTime } = useI18n()
  const when = (value: string | null) => (value && formatDateTime(value)) || t('admin.never')
  const megabytes = (bytes: number) =>
    t('admin.health.megabytes', { size: formatNumber(Math.round((bytes / 1024 / 1024) * 10) / 10) })
  const hours = Math.floor(environment.uptimeSeconds / 3600)
  const minutes = Math.floor((environment.uptimeSeconds % 3600) / 60)

  return (
    <AdminShell title={t('admin.nav.health')}>
      <p className="text-muted">{t('admin.health.lead')}</p>

      <div className="admin-user__grid">
        <Check id="cron" title={t('admin.health.cron')} status={cron.status}>
          <p>
            {t('admin.health.cronLast')} <strong>{when(cron.lastRun)}</strong>
          </p>
          {cron.status !== 'ok' && <p className="text-muted">{t('admin.health.cronHelp')}</p>}
        </Check>

        <Check id="imports" title={t('admin.health.imports')} status={imports.status}>
          <ul className="health-check__list">
            <li>
              Rebrickable : <strong>{when(imports.rebrickable)}</strong>
            </li>
            <li>
              Brickset : <strong>{when(imports.brickset)}</strong>
            </li>
          </ul>
          {imports.lastFailure && (
            <p className="text-muted">
              {t('admin.health.lastFailure', {
                source: imports.lastFailure.source,
                date: formatDateTime(imports.lastFailure.startedAt) ?? '',
              })}{' '}
              <code>{imports.lastFailure.error}</code>
            </p>
          )}
          {imports.status !== 'ok' && <p className="text-muted">{t('admin.health.importsHelp')}</p>}
          <p>
            <Link href="/admin/mises-a-jour">{t('admin.nav.updates')}</Link>
          </p>
        </Check>

        <Check id="database" title={t('admin.health.database')} status={database.status}>
          <p>
            {database.sizeBytes === null
              ? t('admin.health.databaseDown')
              : t('admin.health.databaseSize', { size: megabytes(database.sizeBytes) })}
          </p>
        </Check>

        <section className="card health-check" aria-labelledby="server-title">
          <h2 id="server-title" className="health-check__title">
            {t('admin.health.server')}
          </h2>
          <ul className="health-check__list">
            <li>
              Node.js <strong>{environment.node}</strong> · {t('admin.health.mode')}{' '}
              <strong>{environment.mode}</strong>
            </li>
            <li>{t('admin.health.uptime', { hours, minutes })}</li>
            <li>
              {t('admin.health.mailer')} <strong>{environment.mailer}</strong>
            </li>
          </ul>
        </section>

        <section className="card health-check" aria-labelledby="tools-title">
          <h2 id="tools-title" className="health-check__title">
            {t('admin.health.tools')}
          </h2>
          <p className="text-muted">{t('admin.health.toolsLead')}</p>
          <div className="health-check__actions">
            <Form route="admin.health.email">
              {({ processing }) => (
                <button type="submit" className="btn btn--secondary" disabled={processing}>
                  {t('admin.health.sendTestMail')}
                </button>
              )}
            </Form>
            {environment.bricksetKey ? (
              <Form route="admin.health.brickset">
                {({ processing }) => (
                  <button type="submit" className="btn btn--secondary" disabled={processing}>
                    {t('admin.health.checkQuota')}
                  </button>
                )}
              </Form>
            ) : (
              <p className="text-muted">{t('admin.health.noBricksetKey')}</p>
            )}
          </div>
        </section>
      </div>

      <h2 className="admin-user__actions-title">{t('admin.health.logs')}</h2>
      <p className="text-muted">
        {showIdle ? (
          <Link href="/admin/sante">{t('admin.health.hideIdle')}</Link>
        ) : (
          <Link href="/admin/sante?tout=1">{t('admin.health.showIdle')}</Link>
        )}
      </p>
      {logs.map((log) => (
        <section
          key={log.name}
          className="card health-log"
          aria-labelledby={`log-${log.name}-title`}
        >
          <div className="translation__label-row">
            <h3 id={`log-${log.name}-title`}>
              tmp/{log.name}.log
              <span className="text-muted health-log__meta">
                {' · '}
                {log.exists
                  ? t('admin.health.logMeta', {
                      size: megabytes(log.size),
                      date: (log.modifiedAt && formatDateTime(log.modifiedAt)) || '–',
                    })
                  : t('admin.health.logMissing')}
              </span>
            </h3>
            {log.exists && log.size > 0 && (
              <Form route="admin.health.clearLog" routeParams={{ name: log.name }}>
                {({ processing }) => (
                  <button type="submit" className="btn btn--ghost btn--sm" disabled={processing}>
                    {t('admin.health.clearLog')}
                    <span className="visually-hidden"> tmp/{log.name}.log</span>
                  </button>
                )}
              </Form>
            )}
          </div>
          {log.lines.length > 0 ? (
            <pre className="health-log__content" tabIndex={0} aria-label={`tmp/${log.name}.log`}>
              {log.lines.join('\n')}
            </pre>
          ) : (
            <p className="text-muted">{t('admin.health.logEmpty')}</p>
          )}
          {log.hiddenIdle > 0 && (
            <p className="text-muted">{tc('admin.health.hiddenIdle', log.hiddenIdle)}</p>
          )}
        </section>
      ))}
    </AdminShell>
  )
}

AdminHealth.layout = [AppLayout]
