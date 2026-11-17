import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import SetCard from '~/components/set_card'
import Pagination, { type PaginationData } from '~/components/pagination'
import SetFilters, { type ThemeOption } from '~/components/set_filters'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{
  sets: Data.BrickSet[]
  pagination: PaginationData
  query: Record<string, string>
  themeOptions: ThemeOption[]
  themeName: string | null
}>

export default function SetsIndex({ sets, pagination, query, themeOptions, themeName }: Props) {
  const { t, tc } = useI18n()
  const title = query.q
    ? t('sets.titleSearch', { q: query.q })
    : themeName
      ? t('sets.titleTheme', { theme: themeName })
      : t('sets.title')
  const pageSuffix =
    pagination.currentPage > 1 ? t('sets.pageSuffix', { page: pagination.currentPage }) : ''

  return (
    <>
      <Seo title={`${title}${pageSuffix}`} description={t('sets.metaDescription')} />
      <Breadcrumb items={[{ name: t('breadcrumb.home'), url: '/' }, { name: title }]} />

      <div className="page-header">
        <h1>{title}</h1>
        <p className="text-muted" role="status">
          {tc('sets.results', pagination.total)}
          {pagination.lastPage > 1 &&
            ` · ${t('sets.pageOf', { page: pagination.currentPage, last: pagination.lastPage, perPage: pagination.perPage })}`}
        </p>
      </div>

      <div className="catalogue">
        <SetFilters query={query} themeOptions={themeOptions} />

        <section className="catalogue__results" aria-label={t('sets.resultsLabel')}>
          {sets.length ? (
            <ul className="card-grid">
              {sets.map((set) => (
                <li key={set.id}>
                  <SetCard set={set} headingLevel={2} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <div className="studs" aria-hidden="true" />
              <h2>{t('sets.empty')}</h2>
              <p className="text-muted">{t('sets.emptyHint')}</p>
              <a className="btn btn--secondary" href="/sets">
                {t('sets.seeAll')}
              </a>
            </div>
          )}

          <Pagination pagination={pagination} path="/sets" query={query} />
        </section>
      </div>
    </>
  )
}

SetsIndex.layout = [AppLayout]
