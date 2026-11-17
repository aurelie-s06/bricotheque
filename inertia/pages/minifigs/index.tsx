import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import MinifigCard from '~/components/minifig_card'
import MinifigFilters from '~/components/minifig_filters'
import Pagination, { type PaginationData } from '~/components/pagination'
import { type ThemeOption } from '~/components/set_filters'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{
  minifigs: Data.Minifig[]
  pagination: PaginationData
  query: Record<string, string>
  themeOptions: ThemeOption[]
  themeName: string | null
}>

export default function MinifigsIndex({
  minifigs,
  pagination,
  query,
  themeOptions,
  themeName,
}: Props) {
  const { t, tc } = useI18n()
  const title = query.q
    ? t('minifigs.titleSearch', { q: query.q })
    : themeName
      ? t('minifigs.titleTheme', { theme: themeName })
      : t('minifigs.title')
  const pageSuffix =
    pagination.currentPage > 1 ? t('sets.pageSuffix', { page: pagination.currentPage }) : ''

  return (
    <>
      <Seo title={`${title}${pageSuffix}`} description={t('minifigs.metaDescription')} />

      <div className="page-header">
        <h1>{title}</h1>
        <p className="text-muted" role="status">
          {tc('sets.results', pagination.total)}
          {pagination.lastPage > 1 &&
            ` · ${t('sets.pageOf', { page: pagination.currentPage, last: pagination.lastPage })}`}
        </p>
      </div>

      <div className="catalogue">
        <MinifigFilters query={query} themeOptions={themeOptions} />

        <section className="catalogue__results" aria-label={t('sets.resultsLabel')}>
          {minifigs.length ? (
            <ul className="card-grid">
              {minifigs.map((minifig) => (
                <li key={minifig.id}>
                  <MinifigCard minifig={minifig} headingLevel={2} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <div className="studs" aria-hidden="true" />
              <h2>{t('minifigs.empty')}</h2>
              <p className="text-muted">{t('sets.emptyHint')}</p>
              <a className="btn btn--secondary" href="/minifigs">
                {t('minifigs.seeAll')}
              </a>
            </div>
          )}

          <Pagination pagination={pagination} path="/minifigs" query={query} />
        </section>
      </div>
    </>
  )
}

MinifigsIndex.layout = [AppLayout]
