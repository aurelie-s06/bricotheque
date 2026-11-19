import { useEffect, useRef, useState, type FormEvent } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Check, Heart, Lock, PartyPopper } from 'lucide-react'
import { useI18n } from '~/i18n'

type Kind = 'sets' | 'minifigs'

/**
 * Plain POST form (works without JavaScript); with JavaScript it is sent
 * through Inertia without reloading the page.
 * `reload: 'ids'` only refreshes the collection state (catalogue cards);
 * `'page'` refreshes the whole page (detail pages, collection lists).
 */
function ActionForm({
  action,
  fields,
  reload,
  children,
}: {
  action: string
  fields: Record<string, string>
  reload: 'ids' | 'page'
  children: (busy: boolean) => React.ReactNode
}) {
  const { props } = usePage()
  const [busy, setBusy] = useState(false)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    router.post(action, fields, {
      preserveScroll: true,
      preserveState: true,
      only: reload === 'ids' ? ['collectionIds', 'flash'] : undefined,
      onStart: () => setBusy(true),
      onFinish: () => setBusy(false),
    })
  }

  return (
    <form method="post" action={action} onSubmit={onSubmit} className="collection-buttons__form">
      <input type="hidden" name="_csrf" value={props.csrfToken} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children(busy)}
    </form>
  )
}

/**
 * True for a moment when `pressed` turns on after a click (not on page
 * load): the button then "snaps" like a brick clicked into place.
 */
function useSnap(pressed: boolean) {
  const previous = useRef(pressed)
  const [snap, setSnap] = useState(false)
  useEffect(() => {
    if (pressed && !previous.current) {
      setSnap(true)
      const timer = setTimeout(() => setSnap(false), 400)
      previous.current = pressed
      return () => clearTimeout(timer)
    }
    previous.current = pressed
  }, [pressed])
  return snap
}

/**
 * "Je l'ai" / "Je le veux" toggle buttons (aria-pressed), and "Je l'ai eu !"
 * on wishlist items. Visitors get links to the login page, which brings
 * them back here.
 */
export default function CollectionButtons({
  kind,
  id,
  name,
  reload = 'ids',
  showAcquire = false,
  size = 'sm',
}: {
  kind: Kind
  id: number
  name: string
  reload?: 'ids' | 'page'
  showAcquire?: boolean
  size?: 'sm' | 'md'
}) {
  const { props, url } = usePage()
  const { t } = useI18n()
  const ids = props.collectionIds
  const className = `collection-buttons collection-buttons--${size}`
  const owned = ids ? (kind === 'sets' ? ids.ownedSets : ids.ownedMinifigs).includes(id) : false
  const wanted = ids ? (kind === 'sets' ? ids.wantedSets : ids.wantedMinifigs).includes(id) : false
  const ownedSnap = useSnap(owned)
  const wantedSnap = useSnap(wanted)

  if (!ids) {
    const login = `/connexion?retour=${encodeURIComponent(url)}`
    return (
      <div className={className}>
        {/* Links to a members-only action: marked with a lock (Opquast rule 143) */}
        <a href={login} className="collection-button" title={t('collection.loginToUse')}>
          <Check size={16} aria-hidden="true" /> {t('collection.own')}
          <Lock size={12} aria-hidden="true" className="collection-button__lock" />
          <span className="visually-hidden"> ({t('collection.loginRequired')})</span>
        </a>
        <a href={login} className="collection-button" title={t('collection.loginToUse')}>
          <Heart size={16} aria-hidden="true" /> {t('collection.want')}
          <Lock size={12} aria-hidden="true" className="collection-button__lock" />
          <span className="visually-hidden"> ({t('collection.loginRequired')})</span>
        </a>
      </div>
    )
  }

  return (
    <div className={className}>
      {showAcquire && wanted && !owned && (
        <ActionForm action={`/collection/${kind}/${id}/acquired`} fields={{}} reload={reload}>
          {(busy) => (
            <button
              type="submit"
              className="collection-button collection-button--acquire"
              disabled={busy}
            >
              <PartyPopper size={16} aria-hidden="true" /> {t('collection.acquire')}
              <span className="visually-hidden"> {t('collection.acquireLabel', { name })}</span>
            </button>
          )}
        </ActionForm>
      )}
      <ActionForm
        action={`/collection/${kind}/${id}/owned`}
        fields={{ action: owned ? 'remove' : 'add' }}
        reload={reload}
      >
        {(busy) => (
          <button
            type="submit"
            className={`collection-button collection-button--own${ownedSnap ? ' collection-button--snap' : ''}`}
            aria-pressed={owned}
            disabled={busy}
          >
            <Check size={16} aria-hidden="true" /> {t('collection.own')}
            <span className="visually-hidden"> {t('collection.ownLabel', { name })}</span>
          </button>
        )}
      </ActionForm>
      <ActionForm
        action={`/collection/${kind}/${id}/wanted`}
        fields={{ action: wanted ? 'remove' : 'add' }}
        reload={reload}
      >
        {(busy) => (
          <button
            type="submit"
            className={`collection-button collection-button--want${wantedSnap ? ' collection-button--snap' : ''}`}
            aria-pressed={wanted}
            disabled={busy}
          >
            <Heart size={16} aria-hidden="true" fill={wanted ? 'currentColor' : 'none'} />{' '}
            {t('collection.want')}
            <span className="visually-hidden"> {t('collection.wantLabel', { name })}</span>
          </button>
        )}
      </ActionForm>
    </div>
  )
}
