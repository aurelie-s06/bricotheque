import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import BrickChart from '~/components/brick_chart'
import SetImage from '~/components/set_image'
import StatusBadge from '~/components/status_badge'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'
import { displaySetNum } from '~/lib/set_number'

type Props = InertiaProps<{
  figures: {
    sets: number
    setCopies: number
    minifigs: number
    minifigCopies: number
    pieces: number
  }
  byTheme: { name: string; url: string | null; count: number }[]
  byDecade: { decade: number; count: number }[]
  biggest: Data.BrickSet[]
  oldest: Data.BrickSet[]
  retiringSoon: Data.BrickSet[]
  retired: Data.BrickSet[]
  wishlistDates: Record<string, string | null>
  doubles: { count: number; extraCopies: number }
  doublesTop: Data.Minifig[]
  doublesQuantities: Record<string, number>
  missingMinifigs: { name: string; slug: string; count: number }[]
}>

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="stat-tile">
      <dt className="stat-tile__label">{label}</dt>
      <dd className="stat-tile__value">{value}</dd>
      {hint && <dd className="stat-tile__hint">{hint}</dd>}
    </div>
  )
}

/** Compact list of sets with a thumbnail and one detail */
function SetList({
  sets,
  detail,
}: {
  sets: Data.BrickSet[]
  detail: (set: Data.BrickSet) => React.ReactNode
}) {
  const { t } = useI18n()
  return (
    <ol className="set-list">
      {sets.map((set) => (
        <li key={set.id} className="set-list__item">
          <SetImage
            src={set.imgUrl}
            alt={t('image.set', { setNum: displaySetNum(set.setNum), name: set.name })}
            className="set-list__image"
            thumb
          />
          <div className="set-list__text">
            <Link href={set.url} className="set-list__name">
              {set.name}
            </Link>
            <span className="text-muted set-list__meta">
              {displaySetNum(set.setNum)} · {detail(set)}
            </span>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function DashboardPage(props: Props) {
  const {
    figures,
    byTheme,
    byDecade,
    biggest,
    oldest,
    retiringSoon,
    retired,
    wishlistDates,
    doubles,
    doublesTop,
    doublesQuantities,
    missingMinifigs,
  } = props
  const missingTotal = missingMinifigs.reduce((total, row) => total + row.count, 0)
  const { t, tc, tn, formatNumber, dateNode } = useI18n()

  return (
    <>
      <Seo title={t('dashboard.title')} description={t('dashboard.metaDescription')} />
      <Breadcrumb
        items={[{ name: t('breadcrumb.home'), url: '/' }, { name: t('dashboard.title') }]}
      />
      <div className="page-header">
        <h1>{t('dashboard.title')}</h1>
      </div>

      {figures.sets === 0 && figures.minifigs === 0 ? (
        <div className="empty-state">
          <div className="studs" aria-hidden="true" />
          <h2>{t('dashboard.empty')}</h2>
          <p className="text-muted">{t('dashboard.emptyHint')}</p>
          <Link href="/sets" className="btn">
            {t('collection.browse')}
          </Link>
        </div>
      ) : (
        <>
          <section aria-labelledby="figures-title">
            <h2 id="figures-title" className="visually-hidden">
              {t('dashboard.figures')}
            </h2>
            <dl className="stat-tiles">
              <Tile
                label={t('dashboard.sets')}
                value={formatNumber(figures.sets)}
                hint={tc('collection.copies', figures.setCopies)}
              />
              <Tile
                label={t('dashboard.minifigs')}
                value={formatNumber(figures.minifigs)}
                hint={tc('collection.copies', figures.minifigCopies)}
              />
              <Tile
                label={t('dashboard.pieces')}
                value={formatNumber(figures.pieces)}
                hint={t('dashboard.piecesHint')}
              />
            </dl>
          </section>

          <div className="dashboard-grid">
            {byTheme.length > 0 && (
              <section className="card dashboard-card" aria-labelledby="themes-title">
                <h2 id="themes-title">{t('dashboard.byTheme')}</h2>
                <BrickChart
                  caption={t('dashboard.byThemeCaption')}
                  labelHeader={t('dashboard.theme')}
                  valueHeader={t('dashboard.setCount')}
                  rows={byTheme.map((row) => ({
                    label: row.name || t('dashboard.others'),
                    url: row.url,
                    value: row.count,
                  }))}
                />
              </section>
            )}

            {byDecade.length > 0 && (
              <section className="card dashboard-card" aria-labelledby="decades-title">
                <h2 id="decades-title">{t('dashboard.byDecade')}</h2>
                <BrickChart
                  caption={t('dashboard.byDecadeCaption')}
                  labelHeader={t('dashboard.decade')}
                  valueHeader={t('dashboard.setCount')}
                  rows={byDecade.map((row) => ({
                    label: t('dashboard.decadeLabel', { decade: row.decade }),
                    value: row.count,
                  }))}
                />
              </section>
            )}

            {biggest.length > 0 && (
              <section className="card dashboard-card" aria-labelledby="biggest-title">
                <h2 id="biggest-title">{t('dashboard.biggest')}</h2>
                <SetList sets={biggest} detail={(set) => tc('count.pieces', set.numParts)} />
              </section>
            )}

            {oldest.length > 0 && (
              <section className="card dashboard-card" aria-labelledby="oldest-title">
                <h2 id="oldest-title">{t('dashboard.oldest')}</h2>
                <SetList sets={oldest} detail={(set) => set.year ?? '—'} />
              </section>
            )}
          </div>

          <section className="dashboard-alerts" aria-labelledby="minifigs-title">
            <h2 id="minifigs-title">{t('dashboard.minifigsSection')}</h2>
            <div className="dashboard-grid">
              <section className="card dashboard-card" aria-labelledby="missing-title">
                <h3 id="missing-title">{t('missing.title')}</h3>
                {missingTotal > 0 ? (
                  <>
                    <p className="field__hint">{tc('missing.summary', missingTotal)}</p>
                    <BrickChart
                      caption={t('missing.chartCaption')}
                      labelHeader={t('dashboard.theme')}
                      valueHeader={t('missing.chartValue')}
                      rows={missingMinifigs.map((row) => ({
                        label: row.name,
                        url: `/ma-collection/minifigs-manquantes?theme=${row.slug}`,
                        value: row.count,
                      }))}
                    />
                    <p className="dashboard-card__more">
                      <Link href="/ma-collection/minifigs-manquantes">{t('missing.seeAll')}</Link>
                    </p>
                  </>
                ) : (
                  <p className="text-muted">
                    {figures.sets > 0 ? t('missing.noneShort') : t('missing.noSets')}
                  </p>
                )}
              </section>
              <section className="card dashboard-card" aria-labelledby="doubles-title">
                <h3 id="doubles-title">{t('doubles.title')}</h3>
                {doubles.count > 0 ? (
                  <>
                    <p className="field__hint">
                      {tc('doubles.summary', doubles.count)}{' '}
                      {tc('doubles.extra', doubles.extraCopies)}
                    </p>
                    <ol className="set-list">
                      {doublesTop.map((minifig) => (
                        <li key={minifig.id} className="set-list__item">
                          <SetImage
                            src={minifig.imgUrl}
                            alt={t('image.minifig', { figNum: minifig.figNum, name: minifig.name })}
                            className="set-list__image"
                            thumb
                          />
                          <div className="set-list__text">
                            <Link href={minifig.url} className="set-list__name">
                              {minifig.name}
                            </Link>
                            <span className="text-muted set-list__meta">
                              {minifig.figNum} ·{' '}
                              {tc('doubles.copies', doublesQuantities[minifig.id] ?? 2)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <p className="dashboard-card__more">
                      <Link href="/ma-collection?tab=minifigs&doubles=1">
                        {t('doubles.seeAll')}
                      </Link>
                    </p>
                  </>
                ) : (
                  <p className="text-muted">{t('doubles.none')}</p>
                )}
              </section>
            </div>
          </section>

          <section className="dashboard-alerts" aria-labelledby="alerts-title">
            <h2 id="alerts-title">{t('dashboard.wishlistAlerts')}</h2>
            <div className="dashboard-grid">
              <section className="card dashboard-card" aria-labelledby="soon-title">
                <h3 id="soon-title">{t('dashboard.retiringSoon')}</h3>
                <p className="field__hint">{t('dashboard.retiringSoonHint')}</p>
                {retiringSoon.length ? (
                  <SetList
                    sets={retiringSoon}
                    detail={(set) =>
                      tn('dashboard.until', { date: dateNode(wishlistDates[set.id]) ?? '—' })
                    }
                  />
                ) : (
                  <p className="text-muted">{t('dashboard.noAlerts')}</p>
                )}
              </section>
              <section className="card dashboard-card" aria-labelledby="retired-title">
                <h3 id="retired-title">{t('dashboard.retiredWanted')}</h3>
                <p className="field__hint">{t('dashboard.retiredWantedHint')}</p>
                {retired.length ? (
                  <SetList
                    sets={retired}
                    detail={(set) => (
                      <>
                        {wishlistDates[set.id]
                          ? tn('dashboard.since', { date: dateNode(wishlistDates[set.id]) })
                          : set.year}{' '}
                        <StatusBadge status={set.availabilityStatus} />
                      </>
                    )}
                  />
                ) : (
                  <p className="text-muted">{t('dashboard.noAlerts')}</p>
                )}
              </section>
            </div>
          </section>
        </>
      )}
    </>
  )
}

DashboardPage.layout = [AppLayout]
