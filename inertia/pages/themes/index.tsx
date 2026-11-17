import { useMemo, useState, useSyncExternalStore } from 'react'
import { Link } from '@adonisjs/inertia/react'
import { Search } from 'lucide-react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type ThemeEntry = { name: string; url: string; count: number }
type RootTheme = ThemeEntry & { subthemes: ThemeEntry[] }
type Props = InertiaProps<{ themes: RootTheme[] }>

/** Themes shown as tiles at the top of the page */
const BIGGEST = 8

/** "Ça" → "ca": comparison without case or accents */
const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Letter of the A–Z index ("#" for names starting with a digit or a sign) */
const letterOf = (name: string) => {
  const first = fold(name).charAt(0).toUpperCase()
  return first >= 'A' && first <= 'Z' ? first : '#'
}

/** One line of the directory; the subthemes are listed on the theme page */
function ThemeEntryItem({ theme }: { theme: RootTheme }) {
  const { tc } = useI18n()
  return (
    <li className="theme-entry">
      <Link href={theme.url} className="theme-entry__name">
        {theme.name}
      </Link>
      <span className="theme-entry__count">
        {tc('count.sets', theme.count)}
        {theme.subthemes.length > 0 && ` · ${tc('themes.subthemesCount', theme.subthemes.length)}`}
      </span>
    </li>
  )
}

/**
 * Main themes: the biggest ones as tiles, then an A–Z directory (number of
 * sets and of subthemes; the subthemes are on each theme page). With
 * JavaScript, a field filters the list as you type.
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

  const biggest = useMemo(
    () => [...themes].sort((a, b) => b.count - a.count).slice(0, BIGGEST),
    [themes]
  )

  // Filter on the names of the main themes
  const needle = fold(query.trim())
  const visible = useMemo(
    () => (needle ? themes.filter((theme) => fold(theme.name).includes(needle)) : themes),
    [themes, needle]
  )

  const byLetter = useMemo(() => {
    const groups = new Map<string, RootTheme[]>()
    for (const theme of [...visible].sort((a, b) => a.name.localeCompare(b.name))) {
      const letter = letterOf(theme.name)
      groups.set(letter, [...(groups.get(letter) ?? []), theme])
    }
    return [...groups.entries()].sort(([a], [b]) =>
      a === '#' ? -1 : b === '#' ? 1 : a < b ? -1 : 1
    )
  }, [visible])

  return (
    <>
      <Seo title={t('themes.title')} description={t('themes.metaDescription')} />
      <Breadcrumb items={[{ name: t('breadcrumb.home'), url: '/' }, { name: t('themes.title') }]} />

      <div className="page-header">
        <h1>{t('themes.title')}</h1>
        <p className="text-muted">{tc('themes.roots', themes.length)}</p>
      </div>

      <section aria-labelledby="biggest-title" className="themes-biggest">
        <h2 id="biggest-title">{t('themes.biggest')}</h2>
        <ul className="theme-tiles">
          {biggest.map((theme) => (
            <li key={theme.url}>
              <Link href={theme.url} className="theme-tile">
                <span className="theme-tile__name">{theme.name}</span>
                <span className="theme-tile__count">{tc('count.sets', theme.count)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="all-title">
        <div className="themes-directory__header">
          <h2 id="all-title">{t('themes.all')}</h2>
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

        {!needle && (
          <nav className="letter-index" aria-label={t('themes.letterIndex')}>
            <ul>
              {byLetter.map(([letter]) => (
                <li key={letter}>
                  <a href={`#lettre-${letter === '#' ? '0' : letter}`}>{letter}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {byLetter.length === 0 ? (
          <p>{t('themes.filterEmpty')}</p>
        ) : (
          byLetter.map(([letter, group]) => (
            <section
              key={letter}
              id={`lettre-${letter === '#' ? '0' : letter}`}
              className="letter-group"
              aria-labelledby={`lettre-${letter === '#' ? '0' : letter}-title`}
            >
              <h3
                id={`lettre-${letter === '#' ? '0' : letter}-title`}
                className="letter-group__title"
              >
                {letter === '#' ? '0–9' : letter}
              </h3>
              <ul className="theme-directory">
                {group.map((theme) => (
                  <ThemeEntryItem key={theme.url} theme={theme} />
                ))}
              </ul>
            </section>
          ))
        )}
      </section>
    </>
  )
}

ThemesIndex.layout = [AppLayout]
