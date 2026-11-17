import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import SetImage from '~/components/set_image'
import StatusBadge from '~/components/status_badge'
import Breadcrumb from '~/components/breadcrumb'
import BackLink from '~/components/back_link'
import CollectionButtons from '~/components/collection_buttons'
import { SetDetailsForm, type SetEntry } from '~/components/collection_details'
import { usePage } from '@inertiajs/react'
import ExternalLink from '~/components/external_link'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type SetDetail = Data.BrickSet.Variants['forDetail']
type Props = InertiaProps<{
  set: SetDetail
  themeChain: { name: string; url: string }[]
  backUrl: string | null
  ownedEntry: SetEntry | null
  fallbackDescription: string | null
}>

const paragraphsOf = (text: string | null) => (text ?? '').split(/\n{2,}/).filter(Boolean)

function Prices({ set }: { set: SetDetail }) {
  const { t, formatPrice } = useI18n()
  const prices = [
    formatPrice(set.rrpEur, 'EUR'),
    formatPrice(set.rrpUsd, 'USD'),
    formatPrice(set.rrpGbp, 'GBP'),
  ].filter(Boolean)
  return prices.length ? (
    <>{prices.join(' · ')}</>
  ) : (
    <span className="text-muted">{t('set.unknownPrice')}</span>
  )
}

function EstimatedValue({ set }: { set: SetDetail }) {
  const { t, formatPrice, formatDate } = useI18n()
  const currency = set.estimatedValueCurrency ?? 'EUR'
  const newValue = formatPrice(set.estimatedValueNew, currency)
  const usedValue = formatPrice(set.estimatedValueUsed, currency)
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
          {set.estimatedValueUpdatedAt &&
            t('set.estimateUpdated', { date: formatDate(set.estimatedValueUpdatedAt)! })}
        </span>
      </dd>
    </>
  )
}

function Availability({ set }: { set: SetDetail }) {
  const { t, tn, dateNode } = useI18n()
  const from = dateNode(set.dateFirstAvailable)
  const to = dateNode(set.dateLastAvailable)
  if (!from && !to) {
    return null
  }
  return (
    <>
      <dt>{t('set.availability')}</dt>
      <dd>
        {from && to
          ? tn('set.availableFromTo', { from, to })
          : from
            ? tn('set.availableFrom', { from })
            : tn('set.availableUntil', { to })}
      </dd>
    </>
  )
}

/**
 * French visitors read the machine translation (with the original one
 * click away); English visitors read the original.
 */
function Description({ set, fallback }: { set: SetDetail; fallback: string | null }) {
  const { t, locale } = useI18n()
  const original = paragraphsOf(set.description)
  const translated = locale === 'fr' ? paragraphsOf(set.descriptionFr) : []

  if (!original.length) {
    return <p>{fallback}</p>
  }

  if (translated.length) {
    return (
      <>
        {translated.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        <p className="text-muted">{t('set.descriptionTranslated')}</p>
        <details className="original-text">
          <summary>{t('set.showOriginal')}</summary>
          {original.map((paragraph, index) => (
            <p key={index} lang="en">
              {paragraph}
            </p>
          ))}
        </details>
      </>
    )
  }

  return (
    <>
      {original.map((paragraph, index) => (
        <p key={index} lang="en">
          {paragraph}
        </p>
      ))}
      <p className="text-muted">{t('set.descriptionOriginal')}</p>
    </>
  )
}

function metaText(set: SetDetail, locale: string, fallback: string | null) {
  const text = (locale === 'fr' && set.descriptionFr) || set.description || fallback || ''
  const flat = text.replace(/\s+/g, ' ')
  return flat.length > 155 ? `${flat.slice(0, 155)}…` : flat
}

export default function SetShow({
  set,
  themeChain,
  backUrl,
  ownedEntry,
  fallbackDescription,
}: Props) {
  const { props } = usePage()
  const { t, formatNumber, locale } = useI18n()
  const lastTheme = themeChain.at(-1)
  const showSubtheme = set.subtheme && set.subtheme !== lastTheme?.name
  const hasEstimate = set.estimatedValueNew !== null || set.estimatedValueUsed !== null
  const imageAlt = t('image.set', { setNum: set.setNum, name: set.name })

  return (
    <>
      <Seo
        title={`${set.setNum} ${set.name}`}
        description={t('set.metaDescription', {
          setNum: set.setNum,
          name: set.name,
          text: metaText(set, locale, fallbackDescription),
        })}
      />

      <BackLink href={backUrl} />
      <Breadcrumb
        items={[
          { name: t('breadcrumb.home'), url: '/' },
          { name: t('nav.sets'), url: props.catalogueUrls.sets },
          ...themeChain,
          { name: `${set.setNum} ${set.name}` },
        ]}
      />

      <article className="set-detail">
        <div className="set-detail__media">
          <SetImage src={set.imgUrl} alt={imageAlt} eager />
        </div>

        <div className="set-detail__info">
          <p className="set-card__number">{t('set.number', { setNum: set.setNum })}</p>
          <h1>{set.name}</h1>
          <p>
            <StatusBadge status={set.availabilityStatus} />
          </p>
          <CollectionButtons
            kind="sets"
            id={set.id}
            name={`${set.setNum} ${set.name}`}
            reload="page"
            showAcquire
            size="md"
          />

          <dl className="facts">
            <dt>{t('set.theme')}</dt>
            <dd>
              {themeChain.map((theme, index) => (
                <span key={theme.url}>
                  {index > 0 && <span aria-hidden="true"> › </span>}
                  <Link href={theme.url}>{theme.name}</Link>
                </span>
              ))}
            </dd>

            {showSubtheme && (
              <>
                <dt>{t('set.subtheme')}</dt>
                <dd>{set.subtheme}</dd>
              </>
            )}

            {set.year && (
              <>
                <dt>{t('set.year')}</dt>
                <dd>{set.year}</dd>
              </>
            )}

            <dt>{t('set.pieces')}</dt>
            <dd>{formatNumber(set.numParts)}</dd>

            <dt>{t('set.minifigs')}</dt>
            <dd>{formatNumber(set.numMinifigs)}</dd>

            <dt>{t('set.originalPrice')}</dt>
            <dd>
              <Prices set={set} />
              {set.availabilityStatus === 'retired' && !hasEstimate && set.rrpEur !== null && (
                <span className="text-muted">{t('set.noLongerSold')}</span>
              )}
            </dd>

            <EstimatedValue set={set} />

            <dt>{t('set.status')}</dt>
            <dd>{t(`status.${set.availabilityStatus}`)}</dd>

            <Availability set={set} />
          </dl>

          <ul className="link-list">
            <li>
              <ExternalLink href={set.rebrickableUrl} lang="en">
                {t('set.onRebrickable')}
              </ExternalLink>
            </li>
            {set.bricksetUrl && (
              <li>
                <ExternalLink href={set.bricksetUrl} lang="en">
                  {t('set.onBrickset')}
                </ExternalLink>
              </li>
            )}
          </ul>
        </div>
      </article>

      {ownedEntry && (
        <SetDetailsForm setId={set.id} entry={ownedEntry} hasMinifigs={set.numMinifigs > 0} />
      )}

      <hr className="section-divider studs studs--muted" />

      <section aria-labelledby="description-title" className="prose">
        <h2 id="description-title">{t('set.description')}</h2>
        <Description set={set} fallback={fallbackDescription} />
      </section>

      {set.minifigs && set.minifigs.length > 0 && (
        <section aria-labelledby="minifigs-title" className="set-minifigs">
          <h2 id="minifigs-title">
            {t('set.minifigsTitle', { count: formatNumber(set.numMinifigs) })}
          </h2>
          <ul className="minifig-grid">
            {set.minifigs.map((minifig) => (
              <li key={minifig.id} className="minifig-card">
                <SetImage
                  src={minifig.imgUrl}
                  alt={t('image.minifig', { figNum: minifig.figNum, name: minifig.name })}
                  className="minifig-card__image"
                  thumb
                />
                <div>
                  <Link href={minifig.url} className="minifig-card__link">
                    {minifig.name}
                  </Link>
                  <p className="text-muted minifig-card__meta">
                    {minifig.figNum}
                    {minifig.quantity && minifig.quantity > 1 && ` · ×${minifig.quantity}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

SetShow.layout = [AppLayout]
