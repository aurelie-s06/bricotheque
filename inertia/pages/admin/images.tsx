import { Form, Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import AdminShell from '~/components/admin_shell'
import ImageUrlForm, { type AdminImageItem } from '~/components/image_url_form'
import Pagination, { type PaginationData } from '~/components/pagination'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{
  kind: 'sets' | 'minifigs'
  items: AdminImageItem[]
  pagination: PaginationData
  check: {
    total: number
    checked: number
    lastCheck: string | null
    job: {
      status: 'pending' | 'running' | 'completed' | 'failed'
      progress: { step: number; steps: number; label: string; message: string } | null
      error: string | null
      finishedAt: string | null
    } | null
  }
}>

/** Automatic check of every picture: where it stands, and the button */
function CheckPanel({ check }: { check: Props['check'] }) {
  const { t, formatNumber, formatDateTime } = useI18n()
  const job = check.job
  const busy = job?.status === 'pending' || job?.status === 'running'
  const percent = check.total ? Math.floor((check.checked / check.total) * 100) : 0

  return (
    <section className="card image-check" aria-labelledby="image-check-title">
      <h2 id="image-check-title" className="image-check__title">
        {t('admin.image.checkTitle')}
      </h2>
      <p>
        {t('admin.image.checkSummary', {
          checked: formatNumber(check.checked),
          total: formatNumber(check.total),
          percent,
        })}{' '}
        {check.lastCheck &&
          t('admin.image.checkLast', { date: formatDateTime(check.lastCheck) ?? '' })}
      </p>
      <p className="text-muted">{t('admin.image.checkHint')}</p>
      {job && (
        <p role="status" className="image-check__job">
          {job.status === 'pending' && t('admin.image.jobPending')}
          {job.status === 'running' &&
            t('admin.image.jobRunning', {
              done: formatNumber(job.progress?.step ?? 0),
              total: formatNumber(job.progress?.steps ?? 0),
              message: job.progress?.message ?? '',
            })}
          {job.status === 'completed' &&
            t('admin.image.jobDone', {
              date: (job.finishedAt && formatDateTime(job.finishedAt)) || '',
              message: job.progress?.message ?? '',
            })}
          {job.status === 'failed' && t('admin.image.jobFailed', { error: job.error ?? '' })}
        </p>
      )}
      <Form route="admin.images.check">
        {({ processing }) => (
          <button type="submit" className="btn btn--secondary" disabled={processing || busy}>
            {t('admin.image.checkAll')}
          </button>
        )}
      </Form>
    </section>
  )
}

export default function AdminImages({ kind, items, pagination, check }: Props) {
  const { t, tc } = useI18n()
  return (
    <AdminShell title={t('admin.nav.images')}>
      <p className="text-muted">{t('admin.image.lead')}</p>
      <CheckPanel check={check} />
      <nav className="tabs" aria-label={t('admin.image.tabs')}>
        <ul className="tabs__list">
          {(['sets', 'minifigs'] as const).map((type) => (
            <li key={type}>
              <Link
                href={`/admin/images?type=${type}`}
                className="tabs__link"
                aria-current={kind === type ? 'page' : undefined}
              >
                {t(type === 'sets' ? 'nav.sets' : 'nav.minifigs')}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="text-muted" role="status">
        {tc('admin.image.count', pagination.total)}
      </p>
      {items.length === 0 ? (
        <p>{t('admin.image.none')}</p>
      ) : (
        <div className="admin-images">
          {items.map((item) => (
            <ImageUrlForm key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      )}
      <Pagination pagination={pagination} path="/admin/images" query={{ type: kind }} />
    </AdminShell>
  )
}

AdminImages.layout = [AppLayout]
