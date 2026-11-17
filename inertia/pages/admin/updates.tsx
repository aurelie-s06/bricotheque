import { useEffect, useRef } from 'react'
import { router } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import { RefreshCw } from 'lucide-react'
import AppLayout from '~/layouts/app'
import AdminShell from '~/components/admin_shell'
import { notify } from '~/lib/notify'
import { displaySetNum } from '~/lib/set_number'
import { type InertiaProps } from '~/types'
import { useI18n, type MessageKey } from '~/i18n'

type Job = {
  id: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: { step: number; steps: number; label: string; message: string } | null
  result: { newSets: string[]; newMinifigs: string[] } | null
  error: string | null
  createdAt: string | null
  startedAt: string | null
  finishedAt: string | null
}

type Run = {
  id: number
  source: string
  type: string
  status: string
  startedAt: string | null
  finishedAt: string | null
  durationSeconds: number | null
  stats: Record<string, number> | null
  error: string | null
}

type Props = InertiaProps<{ job: Job | null; history: Run[] }>

/** Refresh of the state while a job is pending or running */
const POLL_MS = 3000

function duration(seconds: number | null) {
  if (seconds === null) return '—'
  const minutes = Math.floor(seconds / 60)
  return minutes ? `${minutes} min ${seconds % 60} s` : `${seconds} s`
}

export default function AdminUpdates({ job, history }: Props) {
  const { t, tc, formatNumber, formatDateTime } = useI18n()
  const active = job?.status === 'pending' || job?.status === 'running'
  const previous = useRef(job?.status)

  // Reloads the job and the history every few seconds while it works
  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => router.reload({ only: ['job', 'history'] }), POLL_MS)
    return () => window.clearInterval(timer)
  }, [active])

  // Notification when the job ends while the page is open
  useEffect(() => {
    const was = previous.current
    previous.current = job?.status
    if (was !== 'running' && was !== 'pending') return
    if (job?.status === 'completed') notify(t('admin.update.done'))
    if (job?.status === 'failed') notify(t('admin.update.failed'), 'error')
  }, [job?.status, t])

  const percent =
    job?.progress && job.status === 'running'
      ? Math.round(((job.progress.step - 0.5) / job.progress.steps) * 100)
      : job?.status === 'completed'
        ? 100
        : 0

  return (
    <AdminShell title={t('admin.nav.updates')}>
      <p className="text-muted">{t('admin.update.lead')}</p>

      <section className="card admin-update" aria-labelledby="update-title">
        <h2 id="update-title">{t('admin.update.title')}</h2>
        <Form route="admin.updates.store">
          {({ processing }) => (
            <button type="submit" className="btn" disabled={processing || active}>
              <RefreshCw size={18} aria-hidden="true" /> {t('admin.update.button')}
            </button>
          )}
        </Form>

        {job && (
          <div className="admin-update__state" role="status" aria-live="polite">
            <p>
              <span className={`job-status job-status--${job.status}`}>
                {t(`admin.update.status.${job.status}` as MessageKey)}
              </span>{' '}
              {job.status === 'running' && job.progress && (
                <>
                  {t('admin.update.step', {
                    step: job.progress.step,
                    steps: job.progress.steps,
                    label: job.progress.label,
                  })}
                </>
              )}
              {job.status === 'pending' && t('admin.update.pendingHint')}
            </p>
            {(job.status === 'running' || job.status === 'completed') && (
              <div className="admin-update__bar">
                <progress max={100} value={percent} aria-label={t('admin.update.progress')}>
                  {percent} %
                </progress>
              </div>
            )}
            {job.status === 'running' && job.progress?.message && (
              <p className="admin-update__message">
                <code>{job.progress.message}</code>
              </p>
            )}
            {job.status === 'failed' && job.error && <p className="field__error">{job.error}</p>}
          </div>
        )}

        {job?.status === 'completed' && job.result && (
          <div className="admin-update__news">
            <h3>{t('admin.update.newsTitle')}</h3>
            <p>
              {tc('admin.update.newSets', job.result.newSets.length)} ·{' '}
              {tc('admin.update.newMinifigs', job.result.newMinifigs.length)}
            </p>
            {job.result.newSets.length > 0 && (
              <ul className="admin-update__list">
                {job.result.newSets.map((setNum) => (
                  <li key={setNum}>
                    <Link href={`/sets/${setNum.toLowerCase()}`}>{displaySetNum(setNum)}</Link>
                  </li>
                ))}
              </ul>
            )}
            {job.result.newMinifigs.length > 0 && (
              <ul className="admin-update__list">
                {job.result.newMinifigs.map((figNum) => (
                  <li key={figNum}>
                    <Link href={`/minifigs/${figNum}`}>{figNum}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="history-title">
        <h2 id="history-title">{t('admin.update.history')}</h2>
        <div className="table-scroll">
          <table className="data-table">
            <caption className="visually-hidden">{t('admin.update.history')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('admin.update.colDate')}</th>
                <th scope="col">{t('admin.update.colSource')}</th>
                <th scope="col">{t('admin.update.colStatus')}</th>
                <th scope="col">{t('admin.update.colDuration')}</th>
                <th scope="col">{t('admin.update.colCreated')}</th>
                <th scope="col">{t('admin.update.colUpdated')}</th>
                <th scope="col">{t('admin.update.colErrors')}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((run) => (
                <tr key={run.id}>
                  <td className="nowrap">
                    {run.startedAt ? (
                      <time dateTime={run.startedAt}>{formatDateTime(run.startedAt)}</time>
                    ) : (
                      '—'
                    )}
                  </td>
                  <th scope="row">
                    {run.source} <span className="text-muted">({run.type})</span>
                  </th>
                  <td>{t(`admin.run.${run.status}` as MessageKey)}</td>
                  <td>{duration(run.durationSeconds)}</td>
                  <td>{formatNumber(run.stats?.created ?? 0)}</td>
                  <td>{formatNumber(run.stats?.updated ?? 0)}</td>
                  <td>{run.error ?? formatNumber(run.stats?.errors ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  )
}

AdminUpdates.layout = [AppLayout]
