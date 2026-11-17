import { useState, type FormEvent } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Check, Heart, PartyPopper } from 'lucide-react'
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

  if (!ids) {
    const login = `/connexion?retour=${encodeURIComponent(url)}`
    return (
      <div className={className}>
        <a href={login} className="collection-button" title={t('collection.loginToUse')}>
          <Check size={16} aria-hidden="true" /> {t('collection.own')}
        </a>
        <a href={login} className="collection-button" title={t('collection.loginToUse')}>
          <Heart size={16} aria-hidden="true" /> {t('collection.want')}
        </a>
      </div>
    )
  }

  const owned = (kind === 'sets' ? ids.ownedSets : ids.ownedMinifigs).includes(id)
  const wanted = (kind === 'sets' ? ids.wantedSets : ids.wantedMinifigs).includes(id)

  return (
    <div className={className}>
      {showAcquire && wanted && !owned && (
        <ActionForm action={`/collection/${kind}/${id}/acquired`} fields={{}} reload={reload}>
          {(busy) => (
            <button
              type="submit"
              className="collection-button collection-button--acquire"
              aria-label={t('collection.acquireLabel', { name })}
              disabled={busy}
            >
              <PartyPopper size={16} aria-hidden="true" /> {t('collection.acquire')}
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
            className="collection-button collection-button--own"
            aria-pressed={owned}
            aria-label={t('collection.ownLabel', { name })}
            disabled={busy}
          >
            <Check size={16} aria-hidden="true" /> {t('collection.own')}
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
            className="collection-button collection-button--want"
            aria-pressed={wanted}
            aria-label={t('collection.wantLabel', { name })}
            disabled={busy}
          >
            <Heart size={16} aria-hidden="true" fill={wanted ? 'currentColor' : 'none'} />{' '}
            {t('collection.want')}
          </button>
        )}
      </ActionForm>
    </div>
  )
}
