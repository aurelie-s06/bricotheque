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
  thisMonth: string
  recentMonths: string[]
  firstYear: number
  sets: Data.BrickSet[]
}>

const monthUrl = (month: string, thisMonth: string) =>
  month === thisMonth ? '/nouveautes' : `/nouveautes/${month}`

export default function NewsShow({ month, thisMonth, recentMonths, firstYear, sets }: Props) {
  const { t, tc, tn, dateNode, locale } = useI18n()
  const intlLocale = locale === 'fr' ? 'fr-FR' : 'en-GB'
  // Same text on the server and in the browser: fixed time zone
  const format = (value: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(intlLocale, { ...options, timeZone: 'UTC' }).format(
      new Date(`${value}-01T12:00:00Z`)
    )
  const monthName = format(month, { month: 'long', year: 'numeric' })
  // French elision: "Nouveautés d’octobre", "Nouveautés de mars"
  const title = t(/^[aeiouyéèêh]/i.test(monthName) ? 'news.titleVowel' : 'news.title', {
    month: monthName,
  })
  const isCurrent = month === thisMonth
  const [shownYear, shownMonth] = month.split('-')
  const lastYear = Number(thisMonth.slice(0, 4))
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => lastYear - index)
  const monthNames = Array.from({ length: 12 }, (_, index) =>
    format(`2000-${String(index + 1).padStart(2, '0')}`, { month: 'long' })
  )

  return (
    <>
      <Seo
        title={title}
        description={t('news.metaDescription', { month: monthName, count: sets.length })}
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

      <div className="news-months">
        <nav aria-label={t('news.recentMonths')} className="news-months__recent">
          <ul className="news-months__list">
            {recentMonths.map((recent) => (
              <li key={recent}>
                <Link
                  href={monthUrl(recent, thisMonth)}
                  className="news-months__pill"
                  aria-current={recent === month ? 'page' : undefined}
                >
                  {format(recent, { month: 'short', year: '2-digit' })}
                  <span className="visually-hidden">
                    {' '}
                    ({format(recent, { month: 'long', year: 'numeric' })})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <form className="news-months__other" action="/nouveautes" method="get">
          <fieldset>
            <legend className="field__label">{t('news.otherMonth')}</legend>
            <div className="news-months__fields">
              <label className="visually-hidden" htmlFor="news-month">
                {t('news.month')}
              </label>
              <select id="news-month" name="mois" className="input" defaultValue={shownMonth}>
                {monthNames.map((name, index) => (
                  <option key={name} value={String(index + 1).padStart(2, '0')}>
                    {name}
                  </option>
                ))}
              </select>
              <label className="visually-hidden" htmlFor="news-year">
                {t('news.year')}
              </label>
              <select id="news-year" name="annee" className="input" defaultValue={shownYear}>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn--secondary">
                {t('news.show')}
              </button>
            </div>
          </fieldset>
        </form>
      </div>

      <p className="text-muted results-count" role="status">
        {tc('news.total', sets.length)}
      </p>
      {sets.length === 0 ? (
        <p className="empty-state">{t('news.empty', { month: monthName })}</p>
      ) : (
        <ul className="card-grid">
          {sets.map((set) => (
            <li key={set.id}>
              <SetCard
                set={set}
                headingLevel={2}
                note={
                  set.releaseDate ? tn('news.outOn', { date: dateNode(set.releaseDate) }) : null
                }
              />
            </li>
          ))}
        </ul>
      )}

      {isCurrent && (
        <p>
          <Link href="/sets?status=upcoming">{t('news.seeUpcoming')}</Link>
        </p>
      )}
    </>
  )
}

NewsShow.layout = [AppLayout]
