import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import SetImage from '~/components/set_image'
import StatusBadge from '~/components/status_badge'
import Breadcrumb from '~/components/breadcrumb'
import ExternalLink from '~/components/external_link'
import { type InertiaProps } from '~/types'
import { formatDate, formatNumber, formatPrice, STATUS_LABELS } from '~/lib/format'

type SetDetail = Data.BrickSet.Variants['forDetail']
type Props = InertiaProps<{
  set: SetDetail
  themeChain: { name: string; url: string }[]
  fallbackDescription: string | null
}>

function metaDescription(set: SetDetail, fallback: string | null) {
  const text = set.description ?? fallback ?? ''
  const short = text.replace(/\s+/g, ' ').slice(0, 155)
  return `Set ${set.setNum} ${set.name} : ${short}${text.length > 155 ? '…' : ''}`
}

function Prices({ set }: { set: SetDetail }) {
  const prices = [
    formatPrice(set.rrpEur, 'EUR'),
    formatPrice(set.rrpUsd, 'USD'),
    formatPrice(set.rrpGbp, 'GBP'),
  ].filter(Boolean)
  return prices.length ? <>{prices.join(' · ')}</> : <span className="text-muted">Inconnu</span>
}

function EstimatedValue({ set }: { set: SetDetail }) {
  const currency = set.estimatedValueCurrency ?? 'EUR'
  const newValue = formatPrice(set.estimatedValueNew, currency)
  const usedValue = formatPrice(set.estimatedValueUsed, currency)
  if (!newValue && !usedValue) {
    return null
  }
  const parts = [
    newValue ? `~${newValue} (neuf)` : null,
    usedValue ? `~${usedValue} (occasion)` : null,
  ].filter(Boolean)
  return (
    <>
      <dt>Valeur estimée</dt>
      <dd>
        {parts.join(' / ')}
        <span className="text-muted">
          {' '}
          – BrickLink
          {set.estimatedValueUpdatedAt &&
            `, mis à jour le ${formatDate(set.estimatedValueUpdatedAt)}`}
        </span>
      </dd>
    </>
  )
}

export default function SetShow({ set, themeChain, fallbackDescription }: Props) {
  const lastTheme = themeChain.at(-1)
  const showSubtheme = set.subtheme && set.subtheme !== lastTheme?.name
  const hasEstimate = set.estimatedValueNew !== null || set.estimatedValueUsed !== null
  const paragraphs = (set.description ?? '').split(/\n{2,}/).filter(Boolean)

  return (
    <>
      <Seo
        title={`${set.setNum} ${set.name}`}
        description={metaDescription(set, fallbackDescription)}
      />

      <Breadcrumb
        items={[
          { name: 'Accueil', url: '/' },
          { name: 'Sets', url: '/sets' },
          ...themeChain,
          { name: `${set.setNum} ${set.name}` },
        ]}
      />

      <article className="set-detail">
        <div className="set-detail__media">
          <SetImage src={set.imgUrl} alt={`Set ${set.setNum} ${set.name}`} eager />
        </div>

        <div className="set-detail__info">
          <p className="set-card__number">Set n° {set.setNum}</p>
          <h1>{set.name}</h1>
          <p>
            <StatusBadge status={set.availabilityStatus} />
          </p>

          <dl className="facts">
            <dt>Thème</dt>
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
                <dt>Sous-thème</dt>
                <dd>{set.subtheme}</dd>
              </>
            )}

            {set.year && (
              <>
                <dt>Année</dt>
                <dd>{set.year}</dd>
              </>
            )}

            <dt>Pièces</dt>
            <dd>{formatNumber(set.numParts)}</dd>

            <dt>Minifigs</dt>
            <dd>{formatNumber(set.numMinifigs)}</dd>

            <dt>Prix d’origine</dt>
            <dd>
              <Prices set={set} />
              {set.availabilityStatus === 'retired' && !hasEstimate && set.rrpEur !== null && (
                <span className="text-muted"> – Plus vendu, prix d’origine</span>
              )}
            </dd>

            <EstimatedValue set={set} />

            <dt>Statut</dt>
            <dd>{STATUS_LABELS[set.availabilityStatus]}</dd>

            {(set.dateFirstAvailable || set.dateLastAvailable) && (
              <>
                <dt>Commercialisation</dt>
                <dd>
                  {set.dateFirstAvailable && `du ${formatDate(set.dateFirstAvailable)}`}
                  {set.dateLastAvailable &&
                    ` ${set.dateFirstAvailable ? 'au' : 'jusqu’au'} ${formatDate(set.dateLastAvailable)}`}
                </dd>
              </>
            )}
          </dl>

          <ul className="link-list">
            <li>
              <ExternalLink href={set.rebrickableUrl}>Voir sur Rebrickable</ExternalLink>
            </li>
            {set.bricksetUrl && (
              <li>
                <ExternalLink href={set.bricksetUrl}>Voir sur Brickset</ExternalLink>
              </li>
            )}
          </ul>
        </div>
      </article>

      <hr className="section-divider studs studs--muted" />

      <section aria-labelledby="description-title" className="prose">
        <h2 id="description-title">Description</h2>
        {paragraphs.length ? (
          <>
            {paragraphs.map((paragraph, index) => (
              <p key={index} lang="en">
                {paragraph}
              </p>
            ))}
            <p className="text-muted">Description en anglais fournie par Brickset (LEGO.com).</p>
          </>
        ) : (
          <p>{fallbackDescription}</p>
        )}
      </section>

      {set.minifigs && set.minifigs.length > 0 && (
        <section aria-labelledby="minifigs-title" className="set-minifigs">
          <h2 id="minifigs-title">Minifigs du set ({formatNumber(set.numMinifigs)})</h2>
          <ul className="minifig-grid">
            {set.minifigs.map((minifig) => (
              <li key={minifig.id} className="minifig-card">
                <SetImage
                  src={minifig.imgUrl}
                  alt={`Minifig ${minifig.figNum} ${minifig.name}`}
                  className="minifig-card__image"
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
