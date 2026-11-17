import { type FormEvent } from 'react'
import { router } from '@inertiajs/react'
import { useI18n, type MessageKey } from '~/i18n'

export type ThemeOption = { slug: string; name: string; depth: number }

const SORTS = [
  'recent',
  'oldest',
  'name',
  'parts_desc',
  'parts_asc',
  'price_asc',
  'price_desc',
] as const
const STATUSES = ['available', 'retired', 'unknown'] as const
const TYPES = ['set', 'book', 'gear', 'parts', 'bundle', 'all'] as const

/** Two number inputs (min / max) under one legend */
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
    <fieldset className="filters__range">
      <legend className="field__label">{legend}</legend>
      {(['min', 'max'] as const).map((bound) => (
        <span key={bound}>
          <label className="visually-hidden" htmlFor={`filter-${name}-${bound}`}>
            {bound === 'min' ? minLabel : maxLabel}
          </label>
          <input
            className="field__input"
            id={`filter-${name}-${bound}`}
            name={`${name}_${bound}`}
            type="number"
            inputMode={step ? 'decimal' : 'numeric'}
            min={min}
            max={max}
            step={step}
            placeholder={t(bound === 'min' ? 'filters.from' : 'filters.to')}
            defaultValue={query[`${name}_${bound}`] ?? ''}
          />
        </span>
      ))}
    </fieldset>
  )
}

/**
 * Catalogue filters. A plain GET form (works without JavaScript); with
 * JavaScript, empty fields are dropped so the URL stays short.
 */
export default function SetFilters({
  query,
  themeOptions,
  action = '/sets',
}: {
  query: Record<string, string>
  themeOptions: ThemeOption[]
  action?: string
}) {
  const { t } = useI18n()

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

  const value = (key: string) => query[key] ?? ''

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
          defaultValue={value('q')}
          placeholder={t('filters.qPlaceholder')}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="filter-theme">
          {t('filters.theme')}
        </label>
        <select
          className="field__input"
          id="filter-theme"
          name="theme"
          defaultValue={value('theme')}
        >
          <option value="">{t('filters.allThemes')}</option>
          {themeOptions.map((theme) => (
            <option key={theme.slug} value={theme.slug}>
              {`${'  '.repeat(theme.depth)}${theme.depth ? '– ' : ''}${theme.name}`}
            </option>
          ))}
        </select>
      </div>

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

      <div className="field">
        <label className="field__label" htmlFor="filter-status">
          {t('filters.status')}
        </label>
        <select
          className="field__input"
          id="filter-status"
          name="status"
          defaultValue={value('status')}
        >
          <option value="">{t('filters.allStatuses')}</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`status.${status}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="filter-type">
          {t('filters.type')}
        </label>
        <select
          className="field__input"
          id="filter-type"
          name="type"
          defaultValue={value('type') || 'set'}
        >
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`kind.${type}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="filter-sort">
          {t('filters.sort')}
        </label>
        <select className="field__input" id="filter-sort" name="sort" defaultValue={value('sort')}>
          <option value="">{value('q') ? t('filters.relevance') : t('sort.recent')}</option>
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
