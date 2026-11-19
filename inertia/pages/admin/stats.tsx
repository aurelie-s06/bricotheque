import AppLayout from '~/layouts/app'
import AdminShell from '~/components/admin_shell'
import BrickChart from '~/components/brick_chart'
import { displaySetNum } from '~/lib/set_number'
import { type InertiaProps } from '~/types'
import { useI18n, type MessageKey } from '~/i18n'

type TopItem = { number: string; name: string; url: string; value: number }

type Props = InertiaProps<{
  figures: {
    users: number
    verified: number
    newUsers: number
    collectors: number
    setsOwned: number
    setsWanted: number
    minifigsOwned: number
    sharedWishlists: number
  }
  signups: { month: string; value: number }[]
  top: {
    setsOwned: TopItem[]
    setsWanted: TopItem[]
    minifigsOwned: TopItem[]
    minifigsWanted: TopItem[]
  }
}>

const TOPS = [
  { key: 'setsOwned', title: 'admin.stats.topSetsOwned', sets: true },
  { key: 'setsWanted', title: 'admin.stats.topSetsWanted', sets: true },
  { key: 'minifigsOwned', title: 'admin.stats.topMinifigsOwned', sets: false },
  { key: 'minifigsWanted', title: 'admin.stats.topMinifigsWanted', sets: false },
] as const

export default function AdminStats({ figures, signups, top }: Props) {
  const { t, formatNumber, locale } = useI18n()
  // Same text on the server and in the browser: fixed time zone
  const monthFormat = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const tiles: [MessageKey, number][] = [
    ['admin.stats.users', figures.users],
    ['admin.stats.verified', figures.verified],
    ['admin.stats.newUsers', figures.newUsers],
    ['admin.stats.collectors', figures.collectors],
    ['admin.stats.setsOwned', figures.setsOwned],
    ['admin.stats.setsWanted', figures.setsWanted],
    ['admin.stats.minifigsOwned', figures.minifigsOwned],
    ['admin.stats.sharedWishlists', figures.sharedWishlists],
  ]

  return (
    <AdminShell title={t('admin.nav.stats')}>
      <dl className="stat-tiles">
        {tiles.map(([label, value]) => (
          <div key={label} className="stat-tile admin-tile">
            <dt className="stat-tile__label">{t(label)}</dt>
            <dd className="stat-tile__value">{formatNumber(value)}</dd>
          </div>
        ))}
      </dl>

      <div className="dashboard-grid admin-stats">
        <section className="card dashboard-card" aria-labelledby="signups-title">
          <h2 id="signups-title">{t('admin.stats.signups')}</h2>
          <BrickChart
            caption={t('admin.stats.signupsCaption')}
            labelHeader={t('admin.stats.month')}
            valueHeader={t('admin.stats.signupCount')}
            rows={signups.map((row) => ({
              label: monthFormat.format(new Date(`${row.month}-01T12:00:00Z`)),
              value: row.value,
            }))}
          />
        </section>

        {TOPS.map(({ key, title, sets }) => (
          <section key={key} className="card dashboard-card" aria-labelledby={`${key}-title`}>
            <h2 id={`${key}-title`}>{t(title)}</h2>
            {top[key].length === 0 ? (
              <p className="text-muted">{t('admin.stats.empty')}</p>
            ) : (
              <BrickChart
                caption={t(title)}
                labelHeader={t('admin.catalogue.item')}
                valueHeader={t('admin.stats.memberCount')}
                rows={top[key].map((item) => ({
                  label: `${sets ? displaySetNum(item.number) : item.number} ${item.name}`,
                  url: item.url,
                  value: item.value,
                }))}
              />
            )}
          </section>
        ))}
      </div>
      <p className="text-muted">{t('admin.stats.note')}</p>
    </AdminShell>
  )
}

AdminStats.layout = [AppLayout]
