import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import SetCard from '~/components/set_card'
import Breadcrumb from '~/components/breadcrumb'
import Pagination, { type PaginationData } from '~/components/pagination'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'
import SetImage from '~/components/set_image'
import { displaySetNum } from '~/lib/set_number'

type ThemeEntry = { name: string; url: string; count: number }
type Featured = {
  setNum: string
  name: string
  url: string
  imgUrl: string | null
  year: number | null
  numParts: number
}
type Props = InertiaProps<{
  theme: ThemeEntry & { firstYear: number | null; lastYear: number | null }
  featured: Featured | null
  themeChain: { name: string; url: string }[]
  subthemes: ThemeEntry[]
  sets: Data.BrickSet[]
  pagination: PaginationData
}>

/** Groups the sets of the page by year, keeping their order */
function byYear(sets: Data.BrickSet[]) {
  const groups: { year: number | null; sets: Data.BrickSet[] }[] = []
  for (const set of sets) {
    const last = groups.at(-1)
    if (last && last.year === set.year) {
      last.sets.push(set)
    } else {
      groups.push({ year: set.year, sets: [set] })
    }
  }
  return groups
}

export default function ThemeShow({
  theme,
  featured,
  themeChain,
  subthemes,
  sets,
  pagination,
}: Props) {
  const { t, tc, formatNumber } = useI18n()
  const pageSuffix =
    pagination.currentPage > 1 ? t('sets.pageSuffix', { page: pagination.currentPage }) : ''

  return (
    <>
      <Seo
        title={`${t('theme.title', { name: theme.name })}${pageSuffix}`}
        description={t('theme.metaDescription', { name: theme.name })}
      />
      <Breadcrumb
        items={[
          { name: t('breadcrumb.home'), url: '/' },
          { name: t('themes.title'), url: '/themes' },
          ...themeChain.slice(0, -1),
          { name: theme.name },
        ]}
      />

      <header className={`theme-banner${featured ? '' : ' theme-banner--plain'}`}>
        <div className="theme-banner__text">
          <h1>{theme.name}</h1>
          <ul className="theme-banner__figures">
            <li>
              <strong>{formatNumber(theme.count)}</strong> {tc('theme.figureSets', theme.count)}
            </li>
            {theme.firstYear && (
              <li>
                <strong>{theme.firstYear}</strong>{' '}
                {theme.lastYear && theme.lastYear !== theme.firstYear
                  ? t('theme.figureUntil', { year: theme.lastYear })
                  : t('theme.figureFirstYear')}
              </li>
            )}
            {subthemes.length > 0 && (
              <li>
                <strong>{subthemes.length}</strong> {tc('theme.figureSubthemes', subthemes.length)}
              </li>
            )}
          </ul>
          {
            /* the figures above say it all, unless books and gear are listed too */
            (pagination.total !== theme.count || pagination.lastPage > 1) && (
              <p className="text-muted">
                {[
                  // the number of sets is already in the figures above
                  pagination.total !== theme.count &&
                    t('theme.productsWithSets', {
                      products: tc('count.products', pagination.total),
                      sets: tc('count.sets', theme.count),
                    }),
                  pagination.lastPage > 1 &&
                    t('sets.pageOf', {
                      page: pagination.currentPage,
                      last: pagination.lastPage,
                      perPage: pagination.perPage,
                    }),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )
          }
        </div>
        {featured && (
          <figure className="theme-banner__featured">
            <Link
              href={featured.url}
              className="theme-banner__image"
              tabIndex={-1}
              aria-hidden="true"
            >
              <SetImage src={featured.imgUrl} alt="" eager />
            </Link>
            <figcaption>
              {t('theme.featured')}{' '}
              <Link href={featured.url}>
                {displaySetNum(featured.setNum)} {featured.name}
              </Link>
              <span className="text-muted">
                {' '}
                · {tc('count.pieces', featured.numParts)}
                {featured.year && ` · ${featured.year}`}
              </span>
            </figcaption>
          </figure>
        )}
      </header>

      {subthemes.length > 0 && (
        <section aria-labelledby="subthemes-title" className="subthemes">
          <h2 id="subthemes-title">{t('theme.subthemes')}</h2>
          <ul className="chip-list">
            {subthemes.map((subtheme) => (
              <li key={subtheme.url}>
                <Link href={subtheme.url} className="chip">
                  {subtheme.name} <span className="chip__count">{subtheme.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {byYear(sets).map((group) => (
        <section key={group.year ?? 'unknown'} aria-labelledby={`year-${group.year ?? 'unknown'}`}>
          <h2 id={`year-${group.year ?? 'unknown'}`} className="year-heading">
            {group.year ?? t('theme.unknownYear')}
          </h2>
          <ul className="card-grid">
            {group.sets.map((set) => (
              <li key={set.id}>
                <SetCard set={set} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <Pagination pagination={pagination} path={theme.url} />
    </>
  )
}

ThemeShow.layout = [AppLayout]
