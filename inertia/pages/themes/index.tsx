import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type ThemeEntry = { name: string; url: string; count: number }
type Props = InertiaProps<{ themes: (ThemeEntry & { subthemes: ThemeEntry[] })[] }>

export default function ThemesIndex({ themes }: Props) {
  const { t, tc } = useI18n()
  return (
    <>
      <Seo title={t('themes.title')} description={t('themes.metaDescription')} />
      <Breadcrumb items={[{ name: t('breadcrumb.home'), url: '/' }, { name: t('themes.title') }]} />

      <div className="page-header">
        <h1>{t('themes.title')}</h1>
        <p className="text-muted">{tc('themes.roots', themes.length)}</p>
      </div>

      <ul className="theme-grid">
        {themes.map((theme) => (
          <li key={theme.url} className="theme-card">
            <h2 className="theme-card__title">
              <Link href={theme.url}>{theme.name}</Link>
            </h2>
            <p className="text-muted">{tc('count.sets', theme.count)}</p>
            {theme.subthemes.length > 0 && (
              <ul className="chip-list" aria-label={t('themes.subthemesOf', { name: theme.name })}>
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
