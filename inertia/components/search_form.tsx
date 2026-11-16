import { useId, type FormEvent } from 'react'
import { router } from '@inertiajs/react'
import { urlFor } from '~/client'

/**
 * Search form for sets and minifigs. It is a plain GET form, so it keeps
 * working without JavaScript; with JavaScript it navigates through Inertia.
 * The input is uncontrolled so text typed before hydration is not lost.
 */
export default function SearchForm({
  defaultValue = '',
  className = '',
  buttonClassName = 'btn',
}: {
  defaultValue?: string
  className?: string
  buttonClassName?: string
}) {
  const id = useId()
  const action = urlFor('search')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = String(new FormData(event.currentTarget).get('q') ?? '').trim()
    router.get(action, q ? { q } : {})
  }

  return (
    <form
      className={`search ${className}`.trim()}
      role="search"
      action={action}
      method="get"
      onSubmit={onSubmit}
    >
      <label className="visually-hidden" htmlFor={id}>
        Rechercher un set ou une minifig
      </label>
      <input
        className="input search__input"
        type="search"
        id={id}
        name="q"
        defaultValue={defaultValue}
        placeholder="Nom ou numéro (ex. 75192)"
      />
      <button type="submit" className={buttonClassName}>
        Rechercher
      </button>
    </form>
  )
}
