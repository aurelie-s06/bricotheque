import { Form, Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import MinifigCard from '~/components/minifig_card'
import Pagination, { type PaginationData } from '~/components/pagination'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{
  theme: { name: string; slug: string } | null
  minifigs: Data.Minifig[]
  pagination: PaginationData
}>

/** Minifigs of the owned sets (of one theme) not in the collection yet */
export default function MissingMinifigs({ theme, minifigs, pagination }: Props) {
  const { t, tc } = useI18n()
  const title = theme ? t('missing.titleTheme', { theme: theme.name }) : t('missing.title')

  return (
    <>
      <Seo title={title} description={t('missing.lead')} />
      <Breadcrumb
        items={[
          { name: t('breadcrumb.home'), url: '/' },
          { name: t('dashboard.title'), url: '/tableau-de-bord' },
          { name: title },
        ]}
      />
      <div className="page-header">
        <h1>{title}</h1>
        <p className="text-muted">{t('missing.lead')}</p>
      </div>

      {pagination.total > 0 ? (
        <>
          <Form route="collection.add_missing_minifigs" className="missing-actions">
            {({ processing }) => (
              <>
                {theme && <input type="hidden" name="theme" value={theme.slug} />}
                <button type="submit" className="btn" disabled={processing}>
                  {tc('missing.addAll', pagination.total)}
                </button>
              </>
            )}
          </Form>
          <p className="text-muted results-count" role="status">
            {tc('missing.count', pagination.total)}
          </p>
          <ul className="card-grid">
            {minifigs.map((minifig) => (
              <li key={minifig.id}>
                <MinifigCard minifig={minifig} headingLevel={2} reload="page" />
              </li>
            ))}
          </ul>
          <Pagination
            pagination={pagination}
            path="/ma-collection/minifigs-manquantes"
            query={theme ? { theme: theme.slug } : {}}
          />
        </>
      ) : (
        <p className="empty-state">{t('missing.none')}</p>
      )}
      <p>
        <Link href="/tableau-de-bord">{t('missing.back')}</Link>
      </p>
    </>
  )
}

MissingMinifigs.layout = [AppLayout]
