import FilterBar, { Range, rangeLabel, type ActiveFilter } from '~/components/filter_bar'
import { type ThemeOption } from '~/components/set_filters'
import { useI18n, type MessageKey } from '~/i18n'

const SORTS = ['recent', 'oldest', 'name', 'number'] as const

/**
 * Minifig filters: search, sort, and the main theme and year of first
 * appearance in the "Filters" panel.
 */
export default function MinifigFilters({
  query,
  themeOptions,
  action = '/minifigs',
  hidden = {},
}: {
  query: Record<string, string>
  themeOptions: ThemeOption[]
  action?: string
  /** Extra fields kept when filtering (e.g. the collection tab) */
  hidden?: Record<string, string>
}) {
  const { t } = useI18n()

  const active: ActiveFilter[] = []
  if (query.theme) {
    const theme = themeOptions.find((option) => option.slug === query.theme)
    active.push({
      keys: ['theme'],
      label: t('filters.chip', {
        name: t('filters.themeShort'),
        value: theme?.name ?? query.theme,
      }),
    })
  }
  if (query.year_min || query.year_max) {
    active.push({
      keys: ['year_min', 'year_max'],
      label: t('filters.chip', {
        name: t('filters.yearFirstShort'),
        value: rangeLabel(t, query.year_min, query.year_max),
      }),
    })
  }

  return (
    <FilterBar
      action={action}
      query={query}
      hidden={hidden}
      searchPlaceholder={t('filters.minifigQPlaceholder')}
      sortOptions={SORTS.map((sort) => ({ value: sort, label: t(`sort.${sort}` as MessageKey) }))}
      active={active}
    >
      <div className="field filter-bar__wide">
        <label className="field__label" htmlFor="filter-theme">
          {t('filters.mainTheme')}
        </label>
        <select className="input" id="filter-theme" name="theme" defaultValue={query.theme ?? ''}>
          <option value="">{t('filters.allThemes')}</option>
          {themeOptions.map((theme) => (
            <option key={theme.slug} value={theme.slug}>
              {theme.name}
            </option>
          ))}
        </select>
      </div>

      <Range
        name="year"
        legend={t('filters.yearFirst')}
        minLabel={t('filters.yearFirstMin')}
        maxLabel={t('filters.yearFirstMax')}
        query={query}
        min={1949}
        max={2100}
      />
    </FilterBar>
  )
}
