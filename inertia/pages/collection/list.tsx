import { usePage } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import { Share2 } from 'lucide-react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import SetCard, { type CollectionEntry } from '~/components/set_card'
import MinifigCard from '~/components/minifig_card'
import SetFilters, { type ThemeOption } from '~/components/set_filters'
import MinifigFilters from '~/components/minifig_filters'
import Pagination, { type PaginationData } from '~/components/pagination'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'
import { notify } from '~/lib/notify'

type Props = InertiaProps<{
  mode: 'collection' | 'wishlist' | 'shared'
  owner: { username: string } | null
  tab: 'sets' | 'minifigs'
  counts: { sets: number; setCopies: number; minifigs: number; minifigCopies: number }
  sets: Data.BrickSet[]
  minifigs: Data.Minifig[]
  pagination: PaginationData
  query: Record<string, string>
  themeOptions: ThemeOption[]
  entries: Record<string, CollectionEntry>
  wishlistTotal: { total: number; unknownPrices: number } | null
  shareUrl: string | null
}>

function SharePanel({ shareUrl }: { shareUrl: string | null }) {
  const { t } = useI18n()
  async function copy() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      notify(t('wishlist.copied'))
    } catch {
      notify(t('wishlist.copyFailed'), 'error')
    }
  }

  return (
    <section className="card share-panel" aria-labelledby="share-title">
      <h2 id="share-title">
        <Share2 size={20} aria-hidden="true" /> {t('wishlist.shareTitle')}
      </h2>
      <p className="text-muted">{t('wishlist.shareText')}</p>
      {shareUrl ? (
        <>
          <div className="field">
            <label className="field__label" htmlFor="share-url">
              {t('wishlist.shareLink')}
            </label>
            <div className="share-panel__link">
              <input
                id="share-url"
                className="field__input"
                type="url"
                value={shareUrl}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
              />
              <button type="button" className="btn btn--sm" onClick={copy}>
                {t('wishlist.copy')}
              </button>
            </div>
          </div>
          <Form route="wishlist.unshare">
            {({ processing }) => (
              <button type="submit" className="btn btn--secondary btn--sm" disabled={processing}>
                {t('wishlist.unshareButton')}
              </button>
            )}
          </Form>
        </>
      ) : (
        <Form route="wishlist.share">
          {({ processing }) => (
            <button type="submit" className="btn btn--sm" disabled={processing}>
              {t('wishlist.shareButton')}
            </button>
          )}
        </Form>
      )}
    </section>
  )
}

export default function CollectionList(props: Props) {
  const { mode, owner, tab, counts, sets, minifigs, pagination, query, themeOptions, entries } =
    props
  const { t, tc, formatPrice } = useI18n()
  const { url } = usePage()
  const path = url.split('?')[0]
  const readOnly = mode === 'shared'

  const title =
    mode === 'collection'
      ? t('collection.title')
      : mode === 'wishlist'
        ? t('wishlist.title')
        : t('shared.title', { username: owner?.username ?? '' })
  const description =
    mode === 'collection'
      ? t('collection.metaDescription')
      : mode === 'wishlist'
        ? t('wishlist.metaDescription')
        : t('shared.metaDescription', { username: owner?.username ?? '' })
  const totalItems = counts.sets + counts.minifigs
  const pageQuery = tab === 'minifigs' ? { ...query, tab: 'minifigs' } : query
  const items = tab === 'sets' ? sets : minifigs

  const emptyTitle =
    mode === 'collection'
      ? t('collection.empty')
      : mode === 'wishlist'
        ? t('wishlist.empty')
        : t('shared.empty')
  const emptyHint =
    mode === 'collection'
      ? t('collection.emptyHint')
      : mode === 'wishlist'
        ? t('wishlist.emptyHint')
        : null

  return (
    <>
      <Seo title={title} description={description} />
      <Breadcrumb items={[{ name: t('breadcrumb.home'), url: '/' }, { name: title }]} />

      <div className="page-header">
        <h1>{title}</h1>
        <p className="text-muted">
          {tc('count.sets', counts.sets)} ({tc('collection.copies', counts.setCopies)}) ·{' '}
          {tc('count.minifigs', counts.minifigs)} ({tc('collection.copies', counts.minifigCopies)})
        </p>
        {readOnly && <p>{t('shared.readonly', { username: owner?.username ?? '' })}</p>}
      </div>

      {props.wishlistTotal && totalItems > 0 && (
        <div className="wishlist-total" role="status">
          <p className="wishlist-total__amount">
            {t('wishlist.total', { price: formatPrice(props.wishlistTotal.total)! })}
          </p>
          <p className="field__hint">
            {t('wishlist.totalHint')}{' '}
            {props.wishlistTotal.unknownPrices > 0 &&
              tc('wishlist.totalUnknown', props.wishlistTotal.unknownPrices)}
          </p>
        </div>
      )}

      {mode === 'wishlist' && <SharePanel shareUrl={props.shareUrl} />}

      <nav className="tabs" aria-label={t('collection.tabs')}>
        <ul className="tabs__list">
          <li>
            <Link
              href={path}
              className="tabs__link"
              aria-current={tab === 'sets' ? 'page' : undefined}
            >
              {t('search.setsSection')} <span className="chip__count">{counts.sets}</span>
            </Link>
          </li>
          <li>
            <Link
              href={`${path}?tab=minifigs`}
              className="tabs__link"
              aria-current={tab === 'minifigs' ? 'page' : undefined}
            >
              {t('search.minifigsSection')} <span className="chip__count">{counts.minifigs}</span>
            </Link>
          </li>
        </ul>
      </nav>

      {totalItems === 0 ? (
        <div className="empty-state">
          <div className="studs" aria-hidden="true" />
          <h2>{emptyTitle}</h2>
          {emptyHint && <p className="text-muted">{emptyHint}</p>}
          {!readOnly && (
            <Link href="/sets" className="btn">
              {t('collection.browse')}
            </Link>
          )}
        </div>
      ) : (
        <div className={readOnly ? undefined : 'catalogue'}>
          {!readOnly && (
            <>
              {tab === 'sets' ? (
                <SetFilters
                  query={query}
                  themeOptions={themeOptions}
                  action={path}
                  defaultType="all"
                  showCondition={mode === 'collection'}
                />
              ) : (
                <MinifigFilters
                  query={query}
                  themeOptions={themeOptions}
                  action={path}
                  hidden={{ tab: 'minifigs' }}
                />
              )}
            </>
          )}

          <section className="catalogue__results" aria-label={t('sets.resultsLabel')}>
            <p className="text-muted results-count" role="status">
              {tc('sets.results', pagination.total)}
              {pagination.lastPage > 1 &&
                ` · ${t('sets.pageOf', { page: pagination.currentPage, last: pagination.lastPage, perPage: pagination.perPage })}`}
            </p>
            {items.length === 0 ? (
              <p className="empty-state">{t('collection.noMatch')}</p>
            ) : (
              <ul className="card-grid">
                {tab === 'sets'
                  ? sets.map((set) => (
                      <li key={set.id}>
                        <SetCard
                          set={set}
                          headingLevel={2}
                          entry={mode === 'collection' ? entries[set.id] : undefined}
                          reload="page"
                          showAcquire={mode === 'wishlist'}
                          showButtons={!readOnly}
                        />
                      </li>
                    ))
                  : minifigs.map((minifig) => (
                      <li key={minifig.id}>
                        <MinifigCard
                          minifig={minifig}
                          headingLevel={2}
                          entry={mode === 'collection' ? entries[minifig.id] : undefined}
                          reload="page"
                          showAcquire={mode === 'wishlist'}
                          showButtons={!readOnly}
                        />
                      </li>
                    ))}
              </ul>
            )}
            <Pagination pagination={pagination} path={path} query={pageQuery} />
          </section>
        </div>
      )}
    </>
  )
}

CollectionList.layout = [AppLayout]
