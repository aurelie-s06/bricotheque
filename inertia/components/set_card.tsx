import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import SetImage from '~/components/set_image'
import StatusBadge from '~/components/status_badge'
import { useI18n } from '~/i18n'

export default function SetCard({
  set,
  headingLevel = 3,
}: {
  set: Data.BrickSet
  headingLevel?: 2 | 3
}) {
  const { t, tc, formatPrice } = useI18n()
  const Heading = `h${headingLevel}` as const
  const meta = [set.year, set.numParts > 0 ? tc('count.pieces', set.numParts) : null].filter(
    Boolean
  )

  return (
    <article className="set-card">
      <div className="set-card__media">
        <SetImage src={set.imgUrl} alt={t('image.set', { setNum: set.setNum, name: set.name })} />
      </div>
      <div className="set-card__body">
        <p className="set-card__number">{set.setNum}</p>
        <Heading className="set-card__title">
          <Link href={set.url} className="set-card__link">
            {set.name}
          </Link>
        </Heading>
        <p className="set-card__meta">{meta.join(' · ')}</p>
        <div className="set-card__footer">
          <StatusBadge status={set.availabilityStatus} />
          {set.rrpEur !== null && (
            <span className="set-card__price">{formatPrice(set.rrpEur)}</span>
          )}
        </div>
      </div>
    </article>
  )
}
