import { Link } from '@adonisjs/inertia/react'
import { useI18n } from '~/i18n'

export type PaginationData = {
  currentPage: number
  lastPage: number
  total: number
  perPage: number
}

function pageWindow(current: number, last: number): (number | 'gap')[] {
  const pages = new Set([1, last, current - 1, current, current + 1])
  const sorted = [...pages].filter((page) => page >= 1 && page <= last).sort((a, b) => a - b)
  const result: (number | 'gap')[] = []
  for (const page of sorted) {
    const previous = result.at(-1)
    if (typeof previous === 'number' && page - previous > 1) {
      result.push('gap')
    }
    result.push(page)
  }
  return result
}

/**
 * Keyboard-usable pagination that keeps the other query parameters.
 */
export default function Pagination({
  pagination,
  path,
  query = {},
}: {
  pagination: PaginationData
  path: string
  query?: Record<string, string>
}) {
  const { t } = useI18n()
  const { currentPage, lastPage } = pagination
  if (lastPage <= 1) {
    return null
  }

  const href = (page: number) => {
    const params = new URLSearchParams(query)
    if (page > 1) {
      params.set('page', String(page))
    }
    const search = params.toString()
    return search ? `${path}?${search}` : path
  }

  return (
    <nav className="pagination" aria-label={t('pagination.label')}>
      <ul className="pagination__list">
        <li>
          {currentPage > 1 ? (
            <Link href={href(currentPage - 1)} className="pagination__link" rel="prev">
              <span aria-hidden="true">←</span> {t('pagination.previous')}
            </Link>
          ) : (
            <span className="pagination__link pagination__link--disabled">
              <span aria-hidden="true">←</span> {t('pagination.previous')}
            </span>
          )}
        </li>
        {pageWindow(currentPage, lastPage).map((page, index) =>
          page === 'gap' ? (
            <li key={`gap-${index}`} className="pagination__gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={page}>
              <Link
                href={href(page)}
                className="pagination__link"
                aria-current={page === currentPage ? 'page' : undefined}
                aria-label={t('pagination.page', { page })}
              >
                {page}
              </Link>
            </li>
          )
        )}
        <li>
          {currentPage < lastPage ? (
            <Link href={href(currentPage + 1)} className="pagination__link" rel="next">
              {t('pagination.next')} <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span className="pagination__link pagination__link--disabled">
              {t('pagination.next')} <span aria-hidden="true">→</span>
            </span>
          )}
        </li>
      </ul>
    </nav>
  )
}
