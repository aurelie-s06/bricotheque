import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import SetCard from '~/components/set_card'
import Breadcrumb from '~/components/breadcrumb'
import Pagination, { type PaginationData } from '~/components/pagination'
import { type InertiaProps } from '~/types'
import { plural } from '~/lib/format'

type ThemeEntry = { name: string; url: string; count: number }
type Props = InertiaProps<{
  theme: ThemeEntry
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

export default function ThemeShow({ theme, themeChain, subthemes, sets, pagination }: Props) {
  const pageSuffix = pagination.currentPage > 1 ? ` – page ${pagination.currentPage}` : ''

  return (
    <>
      <Seo
        title={`Thème ${theme.name}${pageSuffix}`}
        description={`Les ${plural(pagination.total, 'set')} du thème ${theme.name}, classés par année.`}
      />
      <Breadcrumb
        items={[
          { name: 'Accueil', url: '/' },
          { name: 'Thèmes', url: '/themes' },
          ...themeChain.slice(0, -1),
          { name: theme.name },
        ]}
      />

      <div className="page-header">
        <h1>{theme.name}</h1>
        <p className="text-muted">
          {pagination.total === theme.count
            ? plural(theme.count, 'set')
            : `${plural(pagination.total, 'produit')}, dont ${plural(theme.count, 'set')}`}
          {pagination.lastPage > 1 &&
            ` · page ${pagination.currentPage} sur ${pagination.lastPage}`}
        </p>
      </div>

      {subthemes.length > 0 && (
        <section aria-labelledby="subthemes-title" className="subthemes">
          <h2 id="subthemes-title">Sous-thèmes</h2>
          <ul className="chip-list">
            {subthemes.map((subtheme) => (
              <li key={subtheme.url}>
                <Link href={subtheme.url} className="chip">
                  {subtheme.name} <span className="chip__count">{subtheme.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {byYear(sets).map((group) => (
        <section key={group.year ?? 'unknown'} aria-labelledby={`year-${group.year ?? 'unknown'}`}>
          <h2 id={`year-${group.year ?? 'unknown'}`} className="year-heading">
            {group.year ?? 'Année inconnue'}
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
