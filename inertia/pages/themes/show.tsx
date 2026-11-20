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

          {subthemes.length > 0 && (
            <nav className="theme-banner__subthemes" aria-label={t('theme.subthemes')}>
              <ul className="chip-list">
                {subthemes.map((subtheme) => (
                  <li key={subtheme.url}>
                    <Link href={subtheme.url} className="chip">
                      {subtheme.name} <span className="chip__count">{subtheme.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {(pagination.total !== theme.count || pagination.lastPage > 1) && (
            <p className="text-muted theme-banner__pages">
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
          )}
        </div>

        {featured && (
          <figure className="theme-banner__featured">
            <div className="theme-banner__image">
              <SetImage src={featured.imgUrl} alt="" eager />
            </div>
            <figcaption className="theme-banner__caption">
              <p className="theme-banner__set">
                <span className="theme-banner__label">{t('theme.featured')}</span>{' '}
                {displaySetNum(featured.setNum)} {featured.name}
              </p>
              <p className="theme-banner__meta">
                <span className="text-muted">
                  {tc('count.pieces', featured.numParts)}
                  {featured.year && ` · ${featured.year}`}
                </span>
                <Link href={featured.url} className="btn btn--secondary btn--sm">
                  {t('theme.seeFeatured')}
                  <span className="visually-hidden">
                    {' '}
                    {displaySetNum(featured.setNum)} {featured.name}
                  </span>
                </Link>
              </p>
            </figcaption>
          </figure>
        )}
      </header>

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
