import { Link } from '@adonisjs/inertia/react'
import { Blocks, CalendarDays, Tag, UserRound } from 'lucide-react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import SetImage from '~/components/set_image'
import StatusBadge from '~/components/status_badge'
import Breadcrumb from '~/components/breadcrumb'
import CollectionButtons from '~/components/collection_buttons'
import { SetDetailsForm, type SetEntry } from '~/components/collection_details'
import { usePage } from '@inertiajs/react'
import ExternalLink from '~/components/external_link'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'
import { displaySetNum } from '~/lib/set_number'

type SetDetail = Data.BrickSet.Variants['forDetail']
type Props = InertiaProps<{
  set: SetDetail
  themeChain: { name: string; url: string }[]
  ownedEntry: SetEntry | null
  fallbackDescription: string | null
}>

const paragraphsOf = (text: string | null) => (text ?? '').split(/\n{2,}/).filter(Boolean)

/** Key facts at a glance: pieces, minifigs, year and price in euros */
function SpecPills({ set }: { set: SetDetail }) {
  const { t, formatNumber, formatSetPrice } = useI18n()
  const price = formatSetPrice(set)
  const retired = set.availabilityStatus === 'retired'
  const pills = [
    { icon: Blocks, label: t('set.pieces'), value: formatNumber(set.numParts), note: null },
    {
      icon: UserRound,
      label: t('set.minifigs'),
      value: formatNumber(set.numMinifigs),
      note: null,
    },
    set.year
      ? { icon: CalendarDays, label: t('set.year'), value: String(set.year), note: null }
      : null,
    price
      ? {
          icon: Tag,
          label: t('set.originalPrice'),
          value: price,
          // the price of a retired set is the one it had in the shops
          note: retired ? t('set.noLongerSoldShort') : null,
        }
      : null,
  ].filter((pill) => pill !== null)

  return (
    <dl className="spec-pills">
      {pills.map(({ icon: Icon, label, value, note }) => (
        <div key={label} className="spec-pill">
          <Icon size={20} aria-hidden="true" className="spec-pill__icon" />
          <dt className="spec-pill__label">{label}</dt>
          <dd className="spec-pill__value">{value}</dd>
          {note && <dd className="spec-pill__note">{note}</dd>}
        </div>
      ))}
    </dl>
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

export default function SetShow({ set, themeChain, ownedEntry, fallbackDescription }: Props) {
  const { props } = usePage()
  const { t, formatNumber, locale } = useI18n()
  const lastTheme = themeChain.at(-1)
  const showSubtheme = set.subtheme && set.subtheme !== lastTheme?.name
  const imageAlt = t('image.set', { setNum: displaySetNum(set.setNum), name: set.name })

  return (
    <>
      <Seo
        title={`${displaySetNum(set.setNum)} ${set.name}`}
        description={t('set.metaDescription', {
          setNum: displaySetNum(set.setNum),
          name: set.name,
          text: metaText(set, locale, fallbackDescription),
        })}
      />
      <Breadcrumb
        items={[
          { name: t('breadcrumb.home'), url: '/' },
          { name: t('nav.sets'), url: props.catalogueUrls.sets },
          ...themeChain,
          { name: `${displaySetNum(set.setNum)} ${set.name}` },
        ]}
      />

      <article className="set-detail">
        <div className="set-detail__media">
          <SetImage src={set.imgUrl} alt={imageAlt} eager item={{ kind: 'sets', id: set.id }} />
        </div>

        <div className="set-detail__info set-panel">
          <header className="set-panel__head">
            <div className="set-panel__meta">
              <p className="set-card__number">
                {t('set.number', { setNum: displaySetNum(set.setNum) })}
              </p>
              <StatusBadge status={set.availabilityStatus} />
            </div>
            <h1>{set.name}</h1>
          </header>

          <SpecPills set={set} />

          {/* On a phone, a bar fixed at the bottom of the screen */}
          <div className="set-detail__actions set-panel__section">
            <CollectionButtons
              kind="sets"
              id={set.id}
              name={`${displaySetNum(set.setNum)} ${set.name}`}
              reload="page"
              showAcquire
              size="md"
            />
          </div>

          <dl className="facts set-panel__section">
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

            <EstimatedValue set={set} />

            <Availability set={set} />
          </dl>

          <ul className="link-list set-panel__links set-panel__section">
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
