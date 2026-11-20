import { useMemo, useState, useSyncExternalStore } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Search } from 'lucide-react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'
import { thumbnailOf } from '~/components/set_image'

type ThemeEntry = { name: string; url: string; count: number }
type RootTheme = ThemeEntry & { subthemes: ThemeEntry[]; image: string | null }
type Props = InertiaProps<{ themes: RootTheme[] }>

/** "Ça" → "ca": comparison without case or accents */
const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Main themes shown first, in big tiles */
const BIG_THEMES = 12

/** A theme as a tile: the picture of its biggest recent set, its name and figures */
function ThemeTile({ theme }: { theme: RootTheme }) {
  const { tc } = useI18n()
  return (
    <li>
      <Link href={theme.url} className="theme-tile">
        <span className="theme-tile__media">
          <img
            src={
              theme.image
                ? (thumbnailOf(theme.image) ?? theme.image)
                : '/images/placeholder-set.svg'
            }
            alt=""
            loading="lazy"
            decoding="async"
            width={250}
            height={250}
          />
        </span>
        <span className="theme-tile__name">{theme.name}</span>
        <span className="theme-tile__count">
          <span>{tc('count.sets', theme.count)}</span>
          {theme.subthemes.length > 0 && (
            <>
              {' · '}
              <span>{tc('themes.subthemesCount', theme.subthemes.length)}</span>
            </>
          )}
        </span>
      </Link>
    </li>
  )
}

/**
 * Main themes as a gallery: the biggest ones in big tiles, then all the
 * others. Each tile shows the biggest recent set of the theme. With
 * JavaScript, a field filters the tiles as you type.
 */
export default function ThemesIndex({ themes }: Props) {
  const { t, tc } = useI18n()
  const [query, setQuery] = useState('')
  // The filter needs JavaScript: only shown once the page is interactive
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // Filter on the names of the main themes
  const needle = fold(query.trim())
  const visible = useMemo(
    () => (needle ? themes.filter((theme) => fold(theme.name).includes(needle)) : themes),
    [themes, needle]
  )

  // Biggest themes first
  const bySize = useMemo(
    () => [...visible].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    [visible]
  )
  const big = needle ? [] : bySize.slice(0, BIG_THEMES)
  const others = needle ? bySize : bySize.slice(BIG_THEMES)

  return (
    <>
      <Seo title={t('themes.title')} description={t('themes.metaDescription')} />
      <Breadcrumb items={[{ name: t('breadcrumb.home'), url: '/' }, { name: t('themes.title') }]} />

      <div className="page-header page-header__row">
        <div>
          <h1>{t('themes.title')}</h1>
          <p className="text-muted">{tc('themes.roots', themes.length)}</p>
        </div>
        {hydrated && (
          <div className="themes-filter">
            <label htmlFor="themes-filter" className="visually-hidden">
              {t('themes.filterLabel')}
            </label>
            <Search size={18} aria-hidden="true" className="themes-filter__icon" />
            <input
              id="themes-filter"
              className="input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('themes.filterPlaceholder')}
              aria-describedby="themes-filter-status"
            />
          </div>
        )}
      </div>

      <p id="themes-filter-status" className="text-muted" role="status">
        {needle ? tc('themes.filterResults', visible.length) : ''}
      </p>

      {big.length > 0 && (
        <section aria-labelledby="big-title" className="home-section">
          <h2 id="big-title">{t('themes.biggest')}</h2>
          <ul className="theme-tiles">
            {big.map((theme) => (
              <ThemeTile key={theme.url} theme={theme} />
            ))}
          </ul>
        </section>
      )}

      {visible.length === 0 ? (
        <p>{t('themes.filterEmpty')}</p>
      ) : (
        others.length > 0 && (
          <section aria-labelledby="others-title" className="home-section">
            <h2 id="others-title">{needle ? t('themes.all') : t('themes.others')}</h2>
            <ul className="theme-tiles theme-tiles--small">
              {others.map((theme) => (
                <ThemeTile key={theme.url} theme={theme} />
              ))}
            </ul>
          </section>
        )
      )}
    </>
  )
}

ThemesIndex.layout = [AppLayout]
