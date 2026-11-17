import { type FormEvent } from 'react'
import { router } from '@inertiajs/react'
import { Range, type ThemeOption } from '~/components/set_filters'
import { useI18n, type MessageKey } from '~/i18n'

const SORTS = ['recent', 'oldest', 'name', 'number'] as const

/**
 * Minifig filters: plain GET form, empty fields dropped with JavaScript.
 */
export default function MinifigFilters({
  query,
  themeOptions,
}: {
  query: Record<string, string>
  themeOptions: ThemeOption[]
}) {
  const { t } = useI18n()
  const action = '/minifigs'

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params: Record<string, string> = {}
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === 'string' && value.trim() !== '') {
        params[key] = value.trim()
      }
    }
    router.get(action, params)
  }

  return (
    <form className="filters" action={action} method="get" onSubmit={onSubmit}>
      <div className="field">
        <label className="field__label" htmlFor="filter-q">
          {t('filters.q')}
        </label>
        <input
          className="field__input"
          id="filter-q"
          name="q"
          type="search"
          defaultValue={query.q ?? ''}
          placeholder={t('filters.minifigQPlaceholder')}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="filter-theme">
          {t('filters.mainTheme')}
        </label>
        <select
          className="field__input"
          id="filter-theme"
          name="theme"
          defaultValue={query.theme ?? ''}
        >
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

      <div className="field">
        <label className="field__label" htmlFor="filter-sort">
          {t('filters.sort')}
        </label>
        <select
          className="field__input"
          id="filter-sort"
          name="sort"
          defaultValue={query.sort ?? ''}
        >
          <option value="">{query.q ? t('filters.relevance') : t('sort.recent')}</option>
          {SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {t(`sort.${sort}` as MessageKey)}
            </option>
          ))}
        </select>
      </div>

      <div className="filters__actions">
        <button type="submit" className="btn">
          {t('filters.submit')}
        </button>
        <a className="btn btn--secondary" href={action}>
          {t('filters.reset')}
        </a>
      </div>
    </form>
  )
}
