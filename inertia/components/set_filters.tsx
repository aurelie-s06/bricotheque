import { type FormEvent } from 'react'
import { router } from '@inertiajs/react'
import { KIND_LABELS, STATUS_LABELS } from '~/lib/format'

export type ThemeOption = { slug: string; name: string; depth: number }

const SORT_LABELS = {
  recent: 'Plus récents',
  oldest: 'Plus anciens',
  name: 'Nom (A → Z)',
  parts_desc: 'Plus de pièces',
  parts_asc: 'Moins de pièces',
  price_asc: 'Prix croissant',
  price_desc: 'Prix décroissant',
} as const

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
          Nom ou numéro
        </label>
        <input
          className="field__input"
          id="filter-q"
          name="q"
          type="search"
          defaultValue={value('q')}
          placeholder="ex. 75192 ou Faucon"
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="filter-theme">
          Thème (sous-thèmes inclus)
        </label>
        <select
          className="field__input"
          id="filter-theme"
          name="theme"
          defaultValue={value('theme')}
        >
          <option value="">Tous les thèmes</option>
          {themeOptions.map((theme) => (
            <option key={theme.slug} value={theme.slug}>
              {`${'  '.repeat(theme.depth)}${theme.depth ? '– ' : ''}${theme.name}`}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="filters__range">
        <legend className="field__label">Année</legend>
        <label className="visually-hidden" htmlFor="filter-year-min">
          Année minimum
        </label>
        <input
          className="field__input"
          id="filter-year-min"
          name="year_min"
          type="number"
          inputMode="numeric"
          min={1949}
          max={2100}
          placeholder="de"
          defaultValue={value('year_min')}
        />
        <label className="visually-hidden" htmlFor="filter-year-max">
          Année maximum
        </label>
        <input
          className="field__input"
          id="filter-year-max"
          name="year_max"
          type="number"
          inputMode="numeric"
          min={1949}
          max={2100}
          placeholder="à"
          defaultValue={value('year_max')}
        />
      </fieldset>

      <fieldset className="filters__range">
        <legend className="field__label">Nombre de pièces</legend>
        <label className="visually-hidden" htmlFor="filter-parts-min">
          Nombre de pièces minimum
        </label>
        <input
          className="field__input"
          id="filter-parts-min"
          name="parts_min"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="de"
          defaultValue={value('parts_min')}
        />
        <label className="visually-hidden" htmlFor="filter-parts-max">
          Nombre de pièces maximum
        </label>
        <input
          className="field__input"
          id="filter-parts-max"
          name="parts_max"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="à"
          defaultValue={value('parts_max')}
        />
      </fieldset>

      <fieldset className="filters__range">
        <legend className="field__label">Prix d’origine (€)</legend>
        <label className="visually-hidden" htmlFor="filter-price-min">
          Prix minimum en euros
        </label>
        <input
          className="field__input"
          id="filter-price-min"
          name="price_min"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          placeholder="de"
          defaultValue={value('price_min')}
        />
        <label className="visually-hidden" htmlFor="filter-price-max">
          Prix maximum en euros
        </label>
        <input
          className="field__input"
          id="filter-price-max"
          name="price_max"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          placeholder="à"
          defaultValue={value('price_max')}
        />
      </fieldset>

      <div className="field">
        <label className="field__label" htmlFor="filter-status">
          Statut
        </label>
        <select
          className="field__input"
          id="filter-status"
          name="status"
          defaultValue={value('status')}
        >
          <option value="">Tous</option>
          {(['available', 'retired', 'unknown'] as const).map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="filter-type">
          Type de produit
        </label>
        <select
          className="field__input"
          id="filter-type"
          name="type"
          defaultValue={value('type') || 'set'}
        >
          {(['set', 'book', 'gear', 'parts', 'bundle', 'all'] as const).map((type) => (
            <option key={type} value={type}>
              {KIND_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="filter-sort">
          Trier par
        </label>
        <select className="field__input" id="filter-sort" name="sort" defaultValue={value('sort')}>
          <option value="">{value('q') ? 'Pertinence' : 'Plus récents'}</option>
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="filters__actions">
        <button type="submit" className="btn">
          Filtrer
        </button>
        <a className="btn btn--secondary" href={action}>
          Réinitialiser
        </a>
      </div>
    </form>
  )
}
