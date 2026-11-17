import { Form } from '@adonisjs/inertia/react'
import { Share2 } from 'lucide-react'
import { useI18n } from '~/i18n'
import { notify } from '~/lib/notify'

/**
 * Share link of the wishlist: turn sharing on, copy the link, turn it off.
 * Used on the wishlist page and on the account page.
 */
export default function SharePanel({ shareUrl }: { shareUrl: string | null }) {
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
              <button type="button" className="btn" onClick={copy}>
                {t('wishlist.copy')}
              </button>
            </div>
          </div>
          <Form route="wishlist.unshare">
            {({ processing }) => (
              <button type="submit" className="btn btn--secondary" disabled={processing}>
                {t('wishlist.unshareButton')}
              </button>
            )}
          </Form>
        </>
      ) : (
        <Form route="wishlist.share">
          {({ processing }) => (
            <button type="submit" className="btn" disabled={processing}>
              {t('wishlist.shareButton')}
            </button>
          )}
        </Form>
      )}
    </section>
  )
}
