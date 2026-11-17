import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import AdminShell from '~/components/admin_shell'
import ImageUrlForm, { type AdminImageItem } from '~/components/image_url_form'
import Pagination, { type PaginationData } from '~/components/pagination'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{
  kind: 'sets' | 'minifigs'
  items: AdminImageItem[]
  pagination: PaginationData
}>

export default function AdminImages({ kind, items, pagination }: Props) {
  const { t, tc } = useI18n()
  return (
    <AdminShell title={t('admin.nav.images')}>
      <p className="text-muted">{t('admin.image.lead')}</p>
      <nav className="tabs" aria-label={t('admin.image.tabs')}>
        <ul className="tabs__list">
          {(['sets', 'minifigs'] as const).map((type) => (
            <li key={type}>
              <Link
                href={`/admin/images?type=${type}`}
                className="tabs__link"
                aria-current={kind === type ? 'page' : undefined}
              >
                {t(type === 'sets' ? 'nav.sets' : 'nav.minifigs')}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="text-muted" role="status">
        {tc('admin.image.count', pagination.total)}
      </p>
      {items.length === 0 ? (
        <p>{t('admin.image.none')}</p>
      ) : (
        <div className="admin-images">
          {items.map((item) => (
            <ImageUrlForm key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      )}
      <Pagination pagination={pagination} path="/admin/images" query={{ type: kind }} />
    </AdminShell>
  )
}

AdminImages.layout = [AppLayout]
