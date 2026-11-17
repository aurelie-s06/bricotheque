import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import SetImage from '~/components/set_image'
import StatusBadge from '~/components/status_badge'
import Breadcrumb from '~/components/breadcrumb'
import BackLink from '~/components/back_link'
import { usePage } from '@inertiajs/react'
import ExternalLink from '~/components/external_link'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type MinifigDetail = Data.Minifig.Variants['forDetail']
type Props = InertiaProps<{
  minifig: MinifigDetail
  themeChain: { name: string; url: string }[]
  backUrl: string | null
}>

function EstimatedValue({ minifig }: { minifig: MinifigDetail }) {
  const { t, formatPrice, formatDate } = useI18n()
  const currency = minifig.estimatedValueCurrency ?? 'EUR'
  const newValue = formatPrice(minifig.estimatedValueNew, currency)
  const usedValue = formatPrice(minifig.estimatedValueUsed, currency)
  if (!newValue && !usedValue) {
    return null
  }
  const parts = [
    newValue ? t('set.estimateNew', { price: newValue }) : null,
    usedValue ? t('set.estimateUsed', { price: usedValue }) : null,
  ].filter(Boolean)
  return (
    <>
      <dt>{t('set.estimatedValue')}</dt>
      <dd>
        {parts.join(' / ')}
        <span className="text-muted">
          {t('set.estimateSource')}
          {minifig.estimatedValueUpdatedAt &&
            t('set.estimateUpdated', { date: formatDate(minifig.estimatedValueUpdatedAt)! })}
        </span>
      </dd>
    </>
  )
}

export default function MinifigShow({ minifig, themeChain, backUrl }: Props) {
  const { props } = usePage()
  const { t, tc, formatNumber } = useI18n()
  const sets = minifig.sets ?? []
  const imageAlt = t('image.minifig', { figNum: minifig.figNum, name: minifig.name })

  return (
    <>
      <Seo
        title={`${minifig.figNum} ${minifig.name}`}
        description={
          sets.length
            ? t('minifig.metaDescription', {
                figNum: minifig.figNum,
                name: minifig.name,
                sets: tc('count.sets', sets.length),
              })
            : t('minifig.metaDescriptionNoSet', { figNum: minifig.figNum, name: minifig.name })
        }
      />

      <BackLink href={backUrl} />
      <Breadcrumb
        items={[
          { name: t('breadcrumb.home'), url: '/' },
          { name: t('nav.minifigs'), url: props.catalogueUrls.minifigs },
          { name: `${minifig.figNum} ${minifig.name}` },
        ]}
      />

      <article className="set-detail">
        <div className="set-detail__media">
          <SetImage src={minifig.imgUrl} alt={imageAlt} eager />
        </div>

        <div className="set-detail__info">
          <p className="set-card__number">{t('minifig.number', { figNum: minifig.figNum })}</p>
          <h1>{minifig.name}</h1>

          <dl className="facts">
            {themeChain.length > 0 && (
              <>
                <dt>{t('minifig.mainTheme')}</dt>
                <dd>
                  {themeChain.map((theme, index) => (
                    <span key={theme.url}>
                      {index > 0 && <span aria-hidden="true"> › </span>}
                      <Link href={theme.url}>{theme.name}</Link>
                    </span>
                  ))}
                </dd>
              </>
            )}

            {minifig.yearFirst && (
              <>
                <dt>{t('minifig.firstYear')}</dt>
                <dd>{minifig.yearFirst}</dd>
              </>
            )}

            <dt>{t('minifig.pieces')}</dt>
            <dd>{formatNumber(minifig.numParts)}</dd>

            <dt>{t('minifig.inSets')}</dt>
            <dd>{tc('count.sets', sets.length)}</dd>

            <EstimatedValue minifig={minifig} />
          </dl>

          <ul className="link-list">
            <li>
              <ExternalLink href={minifig.rebrickableUrl}>
                {t('minifig.onRebrickable')}
              </ExternalLink>
            </li>
          </ul>
        </div>
      </article>

      <hr className="section-divider studs studs--muted" />

      <section aria-labelledby="sets-title">
        <h2 id="sets-title" className="year-heading">
          {t('minifig.setsTitle', { count: formatNumber(sets.length) })}
        </h2>
        {sets.length ? (
          <ul className="card-grid">
            {sets.map((set) => (
              <li key={set.id}>
                <article className="set-card">
                  <div className="set-card__media">
                    <SetImage
                      src={set.imgUrl}
                      alt={t('image.set', { setNum: set.setNum, name: set.name })}
                    />
                  </div>
                  <div className="set-card__body">
                    <p className="set-card__number">{set.setNum}</p>
                    <h3 className="set-card__title">
                      <Link href={set.url} className="set-card__link">
                        {set.name}
                      </Link>
                    </h3>
                    <p className="set-card__meta">
                      {[
                        set.year,
                        set.quantity ? t('minifig.quantity', { count: set.quantity }) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <div className="set-card__footer">
                      <StatusBadge status={set.availabilityStatus} />
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">{t('minifig.noSets')}</p>
        )}
      </section>
    </>
  )
}

MinifigShow.layout = [AppLayout]
