import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import SetImage from '~/components/set_image'
import { useI18n } from '~/i18n'

export default function MinifigCard({
  minifig,
  headingLevel = 3,
}: {
  minifig: Data.Minifig
  headingLevel?: 2 | 3
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
      </div>
    </article>
  )
}
