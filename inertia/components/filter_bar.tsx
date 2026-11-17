import { useEffect, useRef, type FormEvent, type ReactNode } from 'react'
import { router } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useI18n } from '~/i18n'

export type ActiveFilter = {
  /** Query parameters removed by this chip */
  keys: string[]
  label: string
}

export type SortOption = { value: string; label: string }

/** URL of the list without some parameters (and back to page 1) */
export function urlWithout(action: string, query: Record<string, string>, keys: string[]) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value && key !== 'page' && !keys.includes(key)) params.set(key, value)
  }
  const search = params.toString()
  return search ? `${action}?${search}` : action
}

/**
 * Filter bar above a list: search field, sort and a "Filters" button that
 * unfolds the advanced filters, then the active filters as removable chips.
 *
 * It is a plain GET form, so it works without JavaScript (the panel is a
 * <details> element). With JavaScript, the sort and the quick choices
 * apply as soon as they change, and empty fields are dropped from the URL.
 */
export default function FilterBar({
  action,
  query,
  hidden = {},
  defaults = {},
  searchPlaceholder,
  sortOptions,
  quick,
  active,
  children,
}: {
  action: string
  query: Record<string, string>
  /** Extra fields kept when filtering (e.g. the collection tab) */
  hidden?: Record<string, string>
  /** Values left out of the URL because they are the default */
  defaults?: Record<string, string>
  searchPlaceholder: string
  sortOptions: SortOption[]
  /** Choices shown under the bar and applied immediately */
  quick?: ReactNode
  /** Active advanced filters, shown as chips */
  active: ActiveFilter[]
  /** Fields of the advanced panel */
  children: ReactNode
}) {
  const { t } = useI18n()
  const panel = useRef<HTMLDetailsElement>(null)

  function submit(form: HTMLFormElement) {
    const params: Record<string, string> = {}
    for (const [key, value] of new FormData(form)) {
      const text = typeof value === 'string' ? value.trim() : ''
      if (text !== '' && defaults[key] !== text) params[key] = text
    }
    router.get(action, params)
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit(event.currentTarget)
  }

  // Sort and quick choices apply at once; the panel waits for its button
  function onChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target as HTMLInputElement | HTMLSelectElement
    if (target.dataset.autoApply !== undefined) submit(event.currentTarget)
  }

  // Close the panel with Escape or a click outside
  useEffect(() => {
    function close(event: MouseEvent | KeyboardEvent) {
      const details = panel.current
      if (!details?.open) return
      if (event instanceof KeyboardEvent) {
        if (event.key !== 'Escape') return
        details.open = false
        details.querySelector('summary')?.focus()
      } else if (!details.contains(event.target as Node)) {
        details.open = false
      }
    }
    document.addEventListener('click', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('keydown', close)
    }
  }, [])

  return (
    <form
      className="filter-bar"
      action={action}
      method="get"
      onSubmit={onSubmit}
      onChange={onChange}
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <div className="filter-bar__main">
        <div className="filter-bar__search">
          <label className="visually-hidden" htmlFor="filter-q">
            {t('filters.q')}
          </label>
          <input
            className="input"
            id="filter-q"
            name="q"
            type="search"
            defaultValue={query.q ?? ''}
            placeholder={searchPlaceholder}
          />
          <button type="submit" className="filter-bar__search-button" title={t('search.submit')}>
            <Search size={18} aria-hidden="true" />
            <span className="visually-hidden">{t('search.submit')}</span>
          </button>
        </div>

        <div className="filter-bar__sort">
          <label htmlFor="filter-sort">{t('filters.sort')}</label>
          <select
            className="input"
            id="filter-sort"
            name="sort"
            defaultValue={query.sort ?? ''}
            data-auto-apply
          >
            <option value="">{query.q ? t('filters.relevance') : t('sort.recent')}</option>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <details className="filter-bar__more" ref={panel}>
          <summary className="btn btn--secondary filter-bar__toggle">
            <SlidersHorizontal size={18} aria-hidden="true" />
            {t('filters.more')}
            {active.length > 0 && (
              <span className="filter-bar__badge">
                {active.length}
                <span className="visually-hidden"> {t('filters.activeCount')}</span>
              </span>
            )}
          </summary>
          <div className="filter-bar__panel">
            <div className="filter-bar__fields">{children}</div>
            <div className="filter-bar__actions">
              <button type="submit" className="btn">
                {t('filters.apply')}
              </button>
              {active.length > 0 && (
                <Link
                  href={urlWithout(
                    action,
                    query,
                    active.flatMap((filter) => filter.keys)
                  )}
                  className="btn btn--ghost"
                >
                  {t('filters.clearAll')}
                </Link>
              )}
            </div>
          </div>
        </details>
      </div>

      {quick}

      {active.length > 0 && (
        <div className="filter-bar__active">
          <p className="visually-hidden">{t('filters.activeTitle')}</p>
          <ul className="chip-list">
            {active.map((filter) => (
              <li key={filter.keys.join()}>
                <Link
                  href={urlWithout(action, query, filter.keys)}
                  className="chip chip--active"
                  aria-label={t('filters.remove', { label: filter.label })}
                >
                  {filter.label}
                  <X size={14} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          {active.length > 1 && (
            <Link
              href={urlWithout(
                action,
                query,
                active.flatMap((filter) => filter.keys)
              )}
              className="filter-bar__clear"
            >
              {t('filters.clearAll')}
            </Link>
          )}
        </div>
      )}
    </form>
  )
}

/** Choice between a few values, shown as pills (radio buttons) */
export function PillGroup({
  name,
  legend,
  options,
  value,
  autoApply = false,
}: {
  name: string
  legend: string
  options: { value: string; label: string }[]
  value: string
  autoApply?: boolean
}) {
  return (
    <fieldset className="pill-group">
      <legend className="field__label">{legend}</legend>
      <div className="pill-group__options">
        {options.map((option) => (
          <label key={option.value} className="pill">
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === value}
              data-auto-apply={autoApply ? '' : undefined}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/** Two number inputs ("from" / "to") under one legend */
export function Range({
  name,
  legend,
  minLabel,
  maxLabel,
  query,
  step,
  min,
  max,
}: {
  name: 'year' | 'parts' | 'price'
  legend: string
  minLabel: string
  maxLabel: string
  query: Record<string, string>
  step?: string
  min?: number
  max?: number
}) {
  const { t } = useI18n()
  return (
    <fieldset className="range">
      <legend className="field__label">{legend}</legend>
      <div className="range__inputs">
        {(['min', 'max'] as const).map((bound) => (
          <span key={bound} className="range__bound">
            <label htmlFor={`filter-${name}-${bound}`}>
              <span aria-hidden="true">{t(bound === 'min' ? 'filters.from' : 'filters.to')}</span>
              <span className="visually-hidden">{bound === 'min' ? minLabel : maxLabel}</span>
            </label>
            <input
              className="input"
              id={`filter-${name}-${bound}`}
              name={`${name}_${bound}`}
              type="number"
              inputMode={step ? 'decimal' : 'numeric'}
              min={min}
              max={max}
              step={step}
              defaultValue={query[`${name}_${bound}`] ?? ''}
            />
          </span>
        ))}
      </div>
    </fieldset>
  )
}

/** "2010 – 2015", "from 2010", "up to 2015" */
export function rangeLabel(
  t: ReturnType<typeof useI18n>['t'],
  min: string | undefined,
  max: string | undefined,
  format: (value: string) => string = (value) => value
) {
  if (min && max) return t('filters.chipRange', { min: format(min), max: format(max) })
  if (min) return t('filters.chipFrom', { min: format(min) })
  return t('filters.chipTo', { max: format(max!) })
}
