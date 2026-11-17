import { useMemo, useState } from 'react'
import { useI18n } from '~/i18n'
import { type ThemeOption } from '~/components/set_filters'

type Group = { root: ThemeOption; children: ThemeOption[] }

/** Root themes with their descendants (the options come in tree order) */
function groupsOf(options: ThemeOption[]) {
  const groups: Group[] = []
  for (const option of options) {
    if (option.depth === 0) groups.push({ root: option, children: [] })
    else groups.at(-1)?.children.push(option)
  }
  return groups
}

/**
 * Theme filter in two short lists: the main themes, then the subthemes of
 * the chosen one (only when it has some). The form sends "theme" and
 * "subtheme"; the server keeps the most precise one.
 */
export default function ThemePicker({
  options,
  value,
}: {
  options: ThemeOption[]
  /** Slug in the URL: a main theme or a subtheme */
  value: string
}) {
  const { t } = useI18n()
  const groups = useMemo(() => groupsOf(options), [options])
  const initial = groups.find(
    (group) => group.root.slug === value || group.children.some((child) => child.slug === value)
  )
  const [rootSlug, setRootSlug] = useState(initial?.root.slug ?? '')
  const current = groups.find((group) => group.root.slug === rootSlug)
  const initialSub = initial && initial.root.slug !== value ? value : ''

  return (
    <div className="theme-picker filter-bar__wide">
      <div className="field">
        <label className="field__label" htmlFor="filter-theme">
          {t('filters.theme')}
        </label>
        <select
          className="input"
          id="filter-theme"
          name="theme"
          value={rootSlug}
          onChange={(event) => setRootSlug(event.target.value)}
        >
          <option value="">{t('filters.allThemes')}</option>
          {groups.map(({ root }) => (
            <option key={root.slug} value={root.slug}>
              {root.name}
            </option>
          ))}
        </select>
      </div>

      {current && current.children.length > 0 && (
        <div className="field">
          <label className="field__label" htmlFor="filter-subtheme">
            {t('filters.subtheme')}
          </label>
          <select
            key={rootSlug}
            className="input"
            id="filter-subtheme"
            name="subtheme"
            defaultValue={rootSlug === initial?.root.slug ? initialSub : ''}
          >
            <option value="">{t('filters.allSubthemes', { name: current.root.name })}</option>
            {current.children.map((child) => (
              <option key={child.slug} value={child.slug}>
                {`${'  '.repeat(child.depth - 1)}${child.depth > 1 ? '– ' : ''}${child.name}`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
