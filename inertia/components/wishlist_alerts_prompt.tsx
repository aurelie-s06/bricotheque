import { usePage } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import { useI18n } from '~/i18n'

/**
 * Asked once, after the first set in the wishlist: email alerts when a
 * wanted set comes out or will leave the shops? Off unless accepted.
 */
export default function WishlistAlertsPrompt() {
  const { props } = usePage()
  const { t } = useI18n()
  if (!props.wishlistAlertsPrompt) return null

  return (
    <section className="card minifig-prompt" aria-labelledby="alerts-prompt-title">
      <h2 id="alerts-prompt-title" className="minifig-prompt__title">
        {t('alertsPrompt.title')}
      </h2>
      <p>{t('alertsPrompt.text')}</p>
      <div className="minifig-prompt__actions">
        {(['yes', 'no'] as const).map((answer) => (
          <Form key={answer} route="wishlist_alerts.prompt">
            {({ processing }) => (
              <>
                <input type="hidden" name="answer" value={answer} />
                <button
                  type="submit"
                  className={answer === 'yes' ? 'btn' : 'btn btn--secondary'}
                  disabled={processing}
                >
                  {t(answer === 'yes' ? 'alertsPrompt.yes' : 'alertsPrompt.no')}
                </button>
              </>
            )}
          </Form>
        ))}
      </div>
      <p className="text-muted minifig-prompt__hint">
        {t('minifigPrompt.hint')}{' '}
        <Link href="/mon-compte#preferences-title">{t('account.title')}</Link>.
      </p>
    </section>
  )
}
