import { useId, type FormEvent } from 'react'
import { router } from '@inertiajs/react'
import { urlFor } from '~/client'
import { Search } from 'lucide-react'
import { useI18n } from '~/i18n'

/**
 * Search form for sets and minifigs. It is a plain GET form, so it keeps
 * working without JavaScript; with JavaScript it navigates through Inertia.
 * The input is uncontrolled so text typed before hydration is not lost.
 */
export default function SearchForm({
  defaultValue = '',
  className = '',
  buttonClassName = 'btn',
  compact = false,
}: {
  defaultValue?: string
  className?: string
  buttonClassName?: string
  /** Header version: rounded field with a magnifier button */
  compact?: boolean
}) {
  const { t } = useI18n()
  const id = useId()
  const action = urlFor('search')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = String(new FormData(event.currentTarget).get('q') ?? '').trim()
    router.get(action, q ? { q } : {})
  }

  return (
    <form
      className={`search ${compact ? 'search--compact' : ''} ${className}`.trim()}
      role="search"
      action={action}
      method="get"
      onSubmit={onSubmit}
    >
      <label className="visually-hidden" htmlFor={id}>
        {t('search.label')}
      </label>
      <input
        className="input search__input"
        type="search"
        id={id}
        name="q"
        defaultValue={defaultValue}
        placeholder={t('search.placeholder')}
      />
      {compact ? (
        <button type="submit" className="search__icon-button" title={t('search.submit')}>
          <Search size={18} aria-hidden="true" />
          <span className="visually-hidden">{t('search.submit')}</span>
        </button>
      ) : (
        <button type="submit" className={buttonClassName}>
          {t('search.submit')}
        </button>
      )}
    </form>
  )
}
