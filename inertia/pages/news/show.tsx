import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import SetCard from '~/components/set_card'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{
  month: string
  isCurrent: boolean
  previous: string | null
  next: string | null
  released: Data.BrickSet[]
  upcoming: Data.BrickSet[]
}>

export default function NewsShow({ month, isCurrent, previous, next, released, upcoming }: Props) {
  const { t, tc, tn, dateNode, locale } = useI18n()
  // Same text on the server and in the browser: fixed time zone
  const format = (value: string) =>
    new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${value}-01T12:00:00Z`))
  const monthName = format(month)
  // French elision: "Nouveautés d’octobre", "Nouveautés de mars"
  const title = t(/^[aeiouyéèêh]/i.test(monthName) ? 'news.titleVowel' : 'news.title', {
    month: monthName,
  })
  const total = released.length + upcoming.length

  return (
    <>
      <Seo
        title={title}
        description={t('news.metaDescription', { month: monthName, count: total })}
      />
      <Breadcrumb
        items={[
          { name: t('breadcrumb.home'), url: '/' },
          ...(isCurrent
            ? [{ name: t('nav.news') }]
            : [{ name: t('nav.news'), url: '/nouveautes' }, { name: monthName }]),
        ]}
      />
      <div className="page-header">
        <h1>{title}</h1>
        <p className="text-muted">{t('news.lead')}</p>
      </div>

      <nav className="news-nav" aria-label={t('news.monthsNav')}>
        {previous ? (
          <Link href={`/nouveautes/${previous}`} rel="prev" className="news-nav__previous">
            <span aria-hidden="true">‹ </span>
            {format(previous)}
          </Link>
        ) : (
          <span />
        )}
        {!isCurrent && (
          <Link href="/nouveautes" className="news-nav__current">
            {t('news.thisMonth')}
          </Link>
        )}
        {next ? (
          <Link href={`/nouveautes/${next}`} rel="next" className="news-nav__next">
            {format(next)}
            <span aria-hidden="true"> ›</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>

      {total === 0 && <p className="empty-state">{t('news.empty', { month: monthName })}</p>}

      {released.length > 0 && (
        <section aria-labelledby="released-title" className="home-section">
          <h2 id="released-title">
            {t('news.released')} <span className="text-muted">({released.length})</span>
          </h2>
          <ul className="card-grid">
            {released.map((set) => (
              <li key={set.id}>
                <SetCard
                  set={set}
                  note={
                    set.releaseDate ? tn('news.outOn', { date: dateNode(set.releaseDate) }) : null
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {upcoming.length > 0 && (
        <section aria-labelledby="upcoming-title" className="home-section">
          <h2 id="upcoming-title">
            {t('news.upcoming')} <span className="text-muted">({upcoming.length})</span>
          </h2>
          <ul className="card-grid">
            {upcoming.map((set) => (
              <li key={set.id}>
                <SetCard
                  set={set}
                  note={
                    set.releaseDate
                      ? tn('home.releaseOn', { date: dateNode(set.releaseDate) })
                      : null
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-muted">{tc('news.total', total)}</p>
    </>
  )
}

NewsShow.layout = [AppLayout]
