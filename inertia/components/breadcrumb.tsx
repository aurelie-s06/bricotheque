import { Link } from '@adonisjs/inertia/react'
import { useI18n } from '~/i18n'

export type BreadcrumbItem = { name: string; url?: string }

/**
 * "Fil d'Ariane": the last item is the current page (no link).
 */
export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { t } = useI18n()
  return (
    <nav className="breadcrumb" aria-label={t('breadcrumb.label')}>
      <ol className="breadcrumb__list">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1
          return (
            <li key={`${item.name}-${index}`} className="breadcrumb__item">
              {isCurrent || !item.url ? (
                <span aria-current={isCurrent ? 'page' : undefined}>{item.name}</span>
              ) : (
                <Link href={item.url}>{item.name}</Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
