import ThemePicker from '~/components/theme_picker'
import FilterBar, { PillGroup, Range, rangeLabel, type ActiveFilter } from '~/components/filter_bar'
import { useI18n, type MessageKey } from '~/i18n'

export type ThemeOption = { slug: string; name: string; depth: number }

// "Plus récents" is the first choice of the menu (no sort in the URL)
const SORTS = ['oldest', 'name', 'parts_desc', 'parts_asc', 'price_asc', 'price_desc'] as const
const STATUSES = ['upcoming', 'available', 'retired', 'unknown'] as const
// Spare parts (kind "parts") stay in the catalogue but have no button of their own
const TYPES = ['set', 'book', 'gear', 'bundle', 'all'] as const
const CONDITIONS = ['built', 'in_box', 'sealed', 'partial'] as const

/**
 * Set filters: search, sort, product type (pills) and the advanced filters
 * (theme, year, pieces, price, status, condition) in the "Filters" panel.
 */
export default function SetFilters({
  query,
  themeOptions,
  action = '/sets',
  defaultType = 'set',
  showCondition = false,
}: {
  query: Record<string, string>
  themeOptions: ThemeOption[]
  action?: string
  /** Type selected when the URL has none ("all" in a collection) */
  defaultType?: (typeof TYPES)[number]
  /** Condition of owned sets (collection page) */
  showCondition?: boolean
}) {
  const { t, formatPrice, priceCurrency } = useI18n()
  const value = (key: string) => query[key] ?? ''

  const active: ActiveFilter[] = []
  if (query.theme) {
    const theme = themeOptions.find((option) => option.slug === query.theme)
    active.push({
      keys: ['theme', 'subtheme'],
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
        name: t('filters.year'),
        value: rangeLabel(t, query.year_min, query.year_max),
      }),
    })
  }
  if (query.parts_min || query.parts_max) {
    active.push({
      keys: ['parts_min', 'parts_max'],
      label: t('filters.chip', {
        name: t('filters.partsShort'),
        value: rangeLabel(t, query.parts_min, query.parts_max),
      }),
    })
  }
  if (query.price_min || query.price_max) {
    active.push({
      keys: ['price_min', 'price_max'],
      label: t('filters.chip', {
        name: t('filters.priceShort'),
        value: rangeLabel(t, query.price_min, query.price_max, (price) =>
          formatPrice(Number(price), priceCurrency)!
        ),
      }),
    })
  }
  if (query.status && (STATUSES as readonly string[]).includes(query.status)) {
    active.push({
      keys: ['status'],
      label: t(`status.${query.status as (typeof STATUSES)[number]}`),
    })
  }
  if (
    showCondition &&
    query.condition &&
    (CONDITIONS as readonly string[]).includes(query.condition)
  ) {
    active.push({
      keys: ['condition'],
      label: t(`condition.${query.condition as (typeof CONDITIONS)[number]}`),
    })
  }

  return (
    <FilterBar
      action={action}
      query={query}
      defaults={{ type: defaultType }}
      searchPlaceholder={t('filters.qPlaceholder')}
      sortOptions={SORTS.map((sort) => ({ value: sort, label: t(`sort.${sort}` as MessageKey) }))}
      active={active}
      quick={
        <PillGroup
          name="type"
          legend={t('filters.type')}
          value={value('type') || defaultType}
          options={TYPES.map((type) => ({ value: type, label: t(`kind.${type}`) }))}
          autoApply
        />
      }
    >
      <ThemePicker options={themeOptions} value={value('theme')} />

      <Range
        name="year"
        legend={t('filters.year')}
        minLabel={t('filters.yearMin')}
        maxLabel={t('filters.yearMax')}
        query={query}
        min={1949}
        max={2100}
      />
      <Range
        name="parts"
        legend={t('filters.parts')}
        minLabel={t('filters.partsMin')}
        maxLabel={t('filters.partsMax')}
        query={query}
        min={0}
      />
      <Range
        name="price"
        legend={t('filters.price')}
        minLabel={t('filters.priceMin')}
        maxLabel={t('filters.priceMax')}
        query={query}
        min={0}
        step="any"
      />

      <PillGroup
        name="status"
        legend={t('filters.status')}
        value={value('status')}
        options={[
          { value: '', label: t('filters.allStatuses') },
          ...STATUSES.map((status) => ({ value: status, label: t(`status.${status}`) })),
        ]}
      />

      {showCondition && (
        <PillGroup
          name="condition"
          legend={t('filters.condition')}
          value={value('condition')}
          options={[
            { value: '', label: t('filters.allConditions') },
            ...CONDITIONS.map((condition) => ({
              value: condition,
              label: t(`condition.${condition}`),
            })),
          ]}
        />
      )}
    </FilterBar>
  )
}
