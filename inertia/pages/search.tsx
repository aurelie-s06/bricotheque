import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import SetCard from '~/components/set_card'
import MinifigCard from '~/components/minifig_card'
import SearchForm from '~/components/search_form'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{
  q: string
  sets: Data.BrickSet[]
  setsTotal: number
  minifigs: Data.Minifig[]
  minifigsTotal: number
}>

export default function Search({ q, sets, setsTotal, minifigs, minifigsTotal }: Props) {
  const { t, tc, formatNumber } = useI18n()
  const title = q ? t('search.titleQuery', { q }) : t('search.title')
  const query = encodeURIComponent(q)

  return (
    <>
      <Seo title={title} description={t('search.metaDescription')} />
      <Breadcrumb items={[{ name: t('breadcrumb.home'), url: '/' }, { name: title }]} />

      <div className="page-header">
        <h1>{title}</h1>
        {q && (
          <p className="text-muted" role="status">
            {tc('count.sets', setsTotal)} · {tc('count.minifigs', minifigsTotal)}
            {setsTotal + minifigsTotal > 0 &&
              ` · ${t('search.previewNote', { count: Math.max(sets.length, minifigs.length) })}`}
          </p>
        )}
      </div>

      {!q && (
        <div className="stack">
          <p>{t('search.prompt')}</p>
          <SearchForm />
        </div>
      )}

      {q && setsTotal + minifigsTotal === 0 && (
        <div className="empty-state">
          <div className="studs" aria-hidden="true" />
          <h2>{t('search.noResults', { q })}</h2>
          <p className="text-muted">{t('search.noResultsHint')}</p>
        </div>
      )}

      {q && setsTotal + minifigsTotal > 0 && (
        <>
          <section aria-labelledby="search-sets" className="search-section">
            <div className="home-section__header">
              <h2 id="search-sets">
                {t('search.setsSection')}{' '}
                <span className="chip__count">{formatNumber(setsTotal)}</span>
              </h2>
              {setsTotal > sets.length && (
                <Link href={`/sets?q=${query}`}>
                  {t('search.seeAll', { count: formatNumber(setsTotal) })}
                </Link>
              )}
            </div>
            {sets.length ? (
              <ul className="card-grid">
                {sets.map((set) => (
                  <li key={set.id}>
                    <SetCard set={set} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">{t('search.sectionEmpty')}</p>
            )}
          </section>

          <section aria-labelledby="search-minifigs" className="search-section">
            <div className="home-section__header">
              <h2 id="search-minifigs">
                {t('search.minifigsSection')}{' '}
                <span className="chip__count">{formatNumber(minifigsTotal)}</span>
              </h2>
              {minifigsTotal > minifigs.length && (
                <Link href={`/minifigs?q=${query}`}>
                  {t('search.seeAll', { count: formatNumber(minifigsTotal) })}
                </Link>
              )}
            </div>
            {minifigs.length ? (
              <ul className="card-grid">
                {minifigs.map((minifig) => (
                  <li key={minifig.id}>
                    <MinifigCard minifig={minifig} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">{t('search.sectionEmpty')}</p>
            )}
          </section>
        </>
      )}
    </>
  )
}

Search.layout = [AppLayout]
