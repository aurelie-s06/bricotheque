import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import SetImage from '~/components/set_image'
import StatusBadge from '~/components/status_badge'
import CollectionButtons from '~/components/collection_buttons'
import { useI18n } from '~/i18n'
import { displaySetNum } from '~/lib/set_number'

export type CollectionEntry = { quantity: number; condition: string | null }

export default function SetCard({
  set,
  headingLevel = 3,
  entry,
  reload = 'ids',
  showAcquire = false,
  showButtons = true,
  note,
}: {
  set: Data.BrickSet
  headingLevel?: 2 | 3
  /** Quantity and condition in the collection (collection pages) */
  entry?: CollectionEntry
  reload?: 'ids' | 'page'
  showAcquire?: boolean
  showButtons?: boolean
  /** Extra line under the year (e.g. the release date of an announced set) */
  note?: React.ReactNode
}) {
  const { t, tc, formatPrice } = useI18n()
  const Heading = `h${headingLevel}` as const
  const meta = [set.year, set.numParts > 0 ? tc('count.pieces', set.numParts) : null].filter(
    Boolean
  )

  return (
    <article className="set-card">
      <div className="set-card__media">
        <SetImage
          src={set.imgUrl}
          alt={t('image.set', { setNum: displaySetNum(set.setNum), name: set.name })}
          thumb
          item={{ kind: 'sets', id: set.id }}
        />
      </div>
      <div className="set-card__body">
        <p className="set-card__number">{displaySetNum(set.setNum)}</p>
        <Heading className="set-card__title">
          <Link href={set.url} className="set-card__link">
            {set.name}
          </Link>
        </Heading>
        <p className="set-card__meta">{meta.join(' · ')}</p>
        {note && <p className="set-card__note">{note}</p>}
        {entry && (
          <p className="set-card__entry">
            {tc('collection.copies', entry.quantity)}
            {entry.condition && ` · ${t(`condition.${entry.condition}` as 'condition.built')}`}
          </p>
        )}
        <div className="set-card__footer">
          <StatusBadge status={set.availabilityStatus} />
          {set.rrpEur !== null && (
            <span className="set-card__price">{formatPrice(set.rrpEur)}</span>
          )}
        </div>
        {showButtons && (
          <CollectionButtons
            kind="sets"
            id={set.id}
            name={`${displaySetNum(set.setNum)} ${set.name}`}
            reload={reload}
            showAcquire={showAcquire}
          />
        )}
      </div>
    </article>
  )
}
