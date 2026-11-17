import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import AdminShell from '~/components/admin_shell'
import TranslationForm, { type TranslationItem } from '~/components/translation_form'
import Pagination, { type PaginationData } from '~/components/pagination'
import { type InertiaProps } from '~/types'
import { useI18n, type MessageKey } from '~/i18n'

type Filter = 'todo' | 'done' | 'all'

type Props = InertiaProps<{
  filter: Filter
  q: string
  counts: { translated: number; toTranslate: number }
  items: TranslationItem[]
  pagination: PaginationData
}>

const FILTERS: Filter[] = ['todo', 'done', 'all']

export default function AdminTranslations({ filter, q, counts, items, pagination }: Props) {
  const { t, tc, formatNumber } = useI18n()
  const total = counts.translated + counts.toTranslate
  const percent = total ? Math.round((counts.translated / total) * 100) : 0
  const href = (status: Filter) =>
    `/admin/traductions?statut=${status}${q ? `&q=${encodeURIComponent(q)}` : ''}`

  return (
    <AdminShell title={t('admin.nav.translations')}>
      <p className="text-muted">{t('admin.translations.lead')}</p>

      <dl className="stat-tiles">
        <div className="stat-tile admin-tile">
          <dt className="stat-tile__label">{t('admin.translations.translated')}</dt>
          <dd className="stat-tile__value">{formatNumber(counts.translated)}</dd>
          <dd className="stat-tile__hint">{t('admin.translations.percent', { percent })}</dd>
        </div>
        <div className="stat-tile admin-tile">
          <dt className="stat-tile__label">{t('admin.translations.toTranslate')}</dt>
          <dd className="stat-tile__value">{formatNumber(counts.toTranslate)}</dd>
        </div>
      </dl>

      <div className="translations-toolbar">
        <nav className="tabs" aria-label={t('admin.translations.filters')}>
          <ul className="tabs__list">
            {FILTERS.map((status) => (
              <li key={status}>
                <Link
                  href={href(status)}
                  className="tabs__link"
                  aria-current={filter === status ? 'page' : undefined}
                >
                  {t(`admin.translations.filter.${status}` as MessageKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form className="search" role="search" action="/admin/traductions" method="get">
          <input type="hidden" name="statut" value={filter} />
          <label className="visually-hidden" htmlFor="translations-q">
            {t('admin.translations.search')}
          </label>
          <input
            id="translations-q"
            className="input search__input"
            type="search"
            name="q"
            defaultValue={q}
            placeholder={t('admin.translations.searchPlaceholder')}
          />
          <button type="submit" className="btn btn--secondary">
            {t('search.submit')}
          </button>
        </form>
      </div>

      <p className="text-muted" role="status">
        {tc('admin.translations.count', pagination.total)}
      </p>

      {items.length === 0 ? (
        <p>{t('admin.translations.none')}</p>
      ) : (
        <div className="translations">
          {items.map((item) => (
            <TranslationForm key={item.id} item={item} />
          ))}
        </div>
      )}
      <Pagination
        pagination={pagination}
        path="/admin/traductions"
        query={{ statut: filter, ...(q ? { q } : {}) }}
      />
    </AdminShell>
  )
}

AdminTranslations.layout = [AppLayout]
