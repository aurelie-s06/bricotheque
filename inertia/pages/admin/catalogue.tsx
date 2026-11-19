import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import AdminShell from '~/components/admin_shell'
import Pagination, { type PaginationData } from '~/components/pagination'
import { displaySetNum } from '~/lib/set_number'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Kind = 'sets' | 'minifigs'

type Props = InertiaProps<{
  kind: Kind
  q: string
  items: {
    kind: Kind
    id: number
    number: string
    name: string
    url: string
    year: number | null
    locked: string[]
  }[]
  pagination: PaginationData
}>

export default function AdminCatalogue({ kind, q, items, pagination }: Props) {
  const { t, tc } = useI18n()
  const query: Record<string, string> = q ? { type: kind, q } : { type: kind }

  return (
    <AdminShell title={t('admin.nav.catalogue')}>
      <p className="text-muted">{t('admin.catalogue.lead')}</p>

      <div className="translations-toolbar">
        <nav className="tabs" aria-label={t('admin.image.tabs')}>
          <ul className="tabs__list">
            {(['sets', 'minifigs'] as const).map((type) => (
              <li key={type}>
                <Link
                  href={`/admin/catalogue?type=${type}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                  className="tabs__link"
                  aria-current={kind === type ? 'page' : undefined}
                >
                  {t(type === 'sets' ? 'nav.sets' : 'nav.minifigs')}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form className="search" role="search" action="/admin/catalogue" method="get">
          <input type="hidden" name="type" value={kind} />
          <label className="visually-hidden" htmlFor="catalogue-q">
            {t('admin.catalogue.search')}
          </label>
          <input
            id="catalogue-q"
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
        {q
          ? tc('admin.catalogue.found', pagination.total)
          : tc('admin.catalogue.corrected', pagination.total)}
      </p>
      {items.length === 0 ? (
        <p>{q ? t('admin.catalogue.none') : t('admin.catalogue.noneCorrected')}</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <caption className="visually-hidden">{t('admin.nav.catalogue')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('admin.catalogue.item')}</th>
                {kind === 'sets' && <th scope="col">{t('admin.catalogue.field.year')}</th>}
                <th scope="col">{t('admin.catalogue.lockedColumn')}</th>
                <th scope="col">
                  <span className="visually-hidden">{t('admin.catalogue.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <th scope="row">
                    <Link href={item.url}>
                      {kind === 'sets' ? displaySetNum(item.number) : item.number} {item.name}
                    </Link>
                  </th>
                  {kind === 'sets' && <td>{item.year ?? '–'}</td>}
                  <td>{item.locked.length || '–'}</td>
                  <td>
                    <Link
                      href={`/admin/catalogue/${item.kind}/${item.id}`}
                      className="btn btn--secondary btn--sm"
                    >
                      {t('admin.catalogue.edit')}
                      <span className="visually-hidden"> {item.name}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={pagination} path="/admin/catalogue" query={query} />
    </AdminShell>
  )
}

AdminCatalogue.layout = [AppLayout]
