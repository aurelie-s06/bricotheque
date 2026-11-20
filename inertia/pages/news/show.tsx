import { useEffect, useRef } from 'react'
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
  isFuture: boolean
  recentMonths: string[]
  comingMonths: { month: string; count: number }[]
  firstYear: number
  sets: Data.BrickSet[]
}>

const monthUrl = (month: string, thisMonth: string) =>
  month === thisMonth ? '/nouveautes' : `/nouveautes/${month}`

export default function NewsShow({
  month,
  thisMonth,
  isFuture,
  recentMonths,
  comingMonths,
  firstYear,
  sets,
}: Props) {
  const { t, tc, tn, dateNode, locale } = useI18n()
  const intlLocale = locale === 'fr' ? 'fr-FR' : 'en-GB'
  // Same text on the server and in the browser: fixed time zone
  const format = (value: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(intlLocale, { ...options, timeZone: 'UTC' }).format(
      new Date(`${value}-01T12:00:00Z`)
    )
  const monthName = format(month, { month: 'long', year: 'numeric' })
  // French elision: "Nouveautés d’octobre", "Nouveautés de mars"
  const title = isFuture
    ? t('news.titleFuture', { month: monthName })
    : t(/^[aeiouyéèêh]/i.test(monthName) ? 'news.titleVowel' : 'news.title', {
        month: monthName,
      })
  const isCurrent = month === thisMonth
  const [shownYear, shownMonth] = month.split('-')
  const lastMonth = comingMonths.at(-1)?.month ?? thisMonth
  const lastYear = Number(lastMonth.slice(0, 4))
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => lastYear - index)
  const monthNames = Array.from({ length: 12 }, (_, index) =>
    format(`2000-${String(index + 1).padStart(2, '0')}`, { month: 'long' })
  )

  // One row in time order: the last months, this month, then the coming ones
  const pills = [
    ...[...recentMonths].reverse().map((value) => ({ value, coming: false })),
    ...comingMonths.map(({ month: value }) => ({ value, coming: true })),
  ]

  // The row scrolls by itself to the month shown (it is wider than a phone)
  const row = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const list = row.current
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]')
    if (list && current) {
      list.scrollLeft = current.offsetLeft - list.clientWidth / 2 + current.offsetWidth / 2
    }
  }, [month])

  return (
    <>
      <Seo
        title={title}
        description={
          isFuture
            ? t('news.metaDescriptionFuture', { month: monthName, count: sets.length })
            : t('news.metaDescription', { month: monthName, count: sets.length })
        }
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
        <p className="text-muted">{isFuture ? t('news.leadFuture') : t('news.lead')}</p>
      </div>

      <div className="news-months">
        <nav aria-label={t('news.monthsNav')} className="news-months__recent">
          <ul className="news-months__list" ref={row}>
            {pills.map(({ value, coming }) => (
              <li key={value}>
                <Link
                  href={monthUrl(value, thisMonth)}
                  className={`news-months__pill${coming ? ' news-months__pill--coming' : ''}`}
                  aria-current={value === month ? 'page' : undefined}
                >
                  {format(value, { month: 'short', year: '2-digit' })}
                  <span className="visually-hidden">
                    {' '}
                    ({format(value, { month: 'long', year: 'numeric' })}
                    {coming && `, ${t('news.comingLabel')}`})
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
        {isFuture ? tc('news.totalFuture', sets.length) : tc('news.total', sets.length)}
      </p>
      {sets.length === 0 ? (
        <p className="empty-state">
          {isFuture
            ? t('news.emptyFuture', { month: monthName })
            : t('news.empty', { month: monthName })}
        </p>
      ) : (
        <ul className="card-grid">
          {sets.map((set) => (
            <li key={set.id}>
              <SetCard
                set={set}
                headingLevel={2}
                note={
                  set.releaseDate
                    ? tn(isFuture ? 'home.releaseOn' : 'news.outOn', {
                        date: dateNode(set.releaseDate),
                      })
                    : null
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
