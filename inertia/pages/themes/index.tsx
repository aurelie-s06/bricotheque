import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import { type InertiaProps } from '~/types'
import { plural } from '~/lib/format'

type ThemeEntry = { name: string; url: string; count: number }
type Props = InertiaProps<{ themes: (ThemeEntry & { subthemes: ThemeEntry[] })[] }>

export default function ThemesIndex({ themes }: Props) {
  return (
    <>
      <Seo
        title="Thèmes"
        description="Tous les thèmes de sets de briques (Star Wars, City, Technic…) avec leurs sous-thèmes et leur nombre de sets."
      />
      <Breadcrumb items={[{ name: 'Accueil', url: '/' }, { name: 'Thèmes' }]} />

      <div className="page-header">
        <h1>Thèmes</h1>
        <p className="text-muted">
          {plural(themes.length, 'thème principal', 'thèmes principaux')}
        </p>
      </div>

      <ul className="theme-grid">
        {themes.map((theme) => (
          <li key={theme.url} className="theme-card">
            <h2 className="theme-card__title">
              <Link href={theme.url}>{theme.name}</Link>
            </h2>
            <p className="text-muted">{plural(theme.count, 'set')}</p>
            {theme.subthemes.length > 0 && (
              <ul className="chip-list" aria-label={`Sous-thèmes de ${theme.name}`}>
                {theme.subthemes.map((subtheme) => (
                  <li key={subtheme.url}>
                    <Link href={subtheme.url} className="chip">
                      {subtheme.name} <span className="chip__count">{subtheme.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

ThemesIndex.layout = [AppLayout]
