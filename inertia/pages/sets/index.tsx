import { useEffect, useRef } from 'react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import SetCard from '~/components/set_card'
import Pagination, { type PaginationData } from '~/components/pagination'
import SetFilters, { type ThemeOption } from '~/components/set_filters'
import { type InertiaProps } from '~/types'
import { plural } from '~/lib/format'

type Props = InertiaProps<{
  sets: Data.BrickSet[]
  pagination: PaginationData
  query: Record<string, string>
  themeOptions: ThemeOption[]
  themeName: string | null
}>

export default function SetsIndex({ sets, pagination, query, themeOptions, themeName }: Props) {
  const title = query.q
    ? `Recherche « ${query.q} » dans les sets`
    : themeName
      ? `Sets ${themeName}`
      : 'Catalogue des sets'
  const pageSuffix = pagination.currentPage > 1 ? ` – page ${pagination.currentPage}` : ''

  // Filters are folded on small screens (results first) and unfolded on
  // large screens, where they sit in a side column
  const filtersPanel = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    if (filtersPanel.current && window.matchMedia('(min-width: 960px)').matches) {
      filtersPanel.current.open = true
    }
  }, [])

  return (
    <>
      <Seo
        title={`${title}${pageSuffix}`}
        description="Tous les sets de briques, anciens, actuels et retirés : recherche par nom ou numéro, filtres par thème, année, pièces, statut et prix."
      />

      <div className="page-header">
        <h1>{title}</h1>
        <p className="text-muted" role="status">
          {plural(pagination.total, 'résultat')}
          {pagination.lastPage > 1 &&
            ` · page ${pagination.currentPage} sur ${pagination.lastPage}`}
        </p>
      </div>

      <div className="catalogue">
        <details className="catalogue__filters" ref={filtersPanel}>
          <summary className="catalogue__filters-toggle">Filtres et tri</summary>
          <SetFilters query={query} themeOptions={themeOptions} />
        </details>

        <section className="catalogue__results" aria-label="Résultats">
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
              <h2>Aucun set ne correspond</h2>
              <p className="text-muted">Essaie avec moins de filtres ou un autre mot-clé.</p>
              <a className="btn btn--secondary" href="/sets">
                Voir tous les sets
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
