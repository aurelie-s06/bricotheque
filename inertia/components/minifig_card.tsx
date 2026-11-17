import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import SetImage from '~/components/set_image'
import CollectionButtons from '~/components/collection_buttons'
import { type CollectionEntry } from '~/components/set_card'
import { useI18n } from '~/i18n'

export default function MinifigCard({
  minifig,
  headingLevel = 3,
  entry,
  reload = 'ids',
  showAcquire = false,
  showButtons = true,
}: {
  minifig: Data.Minifig
  headingLevel?: 2 | 3
  entry?: CollectionEntry
  reload?: 'ids' | 'page'
  showAcquire?: boolean
  showButtons?: boolean
}) {
  const { t, tc } = useI18n()
  const Heading = `h${headingLevel}` as const
  const meta = [
    minifig.yearFirst,
    minifig.numParts > 0 ? tc('count.pieces', minifig.numParts) : null,
  ].filter(Boolean)

  return (
    <article className="set-card">
      <div className="set-card__media">
        <SetImage
          src={minifig.imgUrl}
          alt={t('image.minifig', { figNum: minifig.figNum, name: minifig.name })}
          thumb
        />
      </div>
      <div className="set-card__body">
        <p className="set-card__number">{minifig.figNum}</p>
        <Heading className="set-card__title">
          <Link href={minifig.url} className="set-card__link">
            {minifig.name}
          </Link>
        </Heading>
        <p className="set-card__meta">{meta.join(' · ')}</p>
        {entry && <p className="set-card__entry">{tc('collection.copies', entry.quantity)}</p>}
        {showButtons && (
          <div className="set-card__actions">
            <CollectionButtons
              kind="minifigs"
              id={minifig.id}
              name={`${minifig.figNum} ${minifig.name}`}
              reload={reload}
              showAcquire={showAcquire}
            />
          </div>
        )}
      </div>
    </article>
  )
}
