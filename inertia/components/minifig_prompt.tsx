import { usePage } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import { useI18n } from '~/i18n'

/**
 * Asked once, after the first set in the collection: should the minifigs
 * of the sets be added too? Shown on every page until the member answers.
 */
export default function MinifigPrompt() {
  const { props } = usePage()
  const { t, tc } = useI18n()
  const prompt = props.minifigPrompt
  if (!prompt) return null

  return (
    <section className="card minifig-prompt" aria-labelledby="minifig-prompt-title">
      <h2 id="minifig-prompt-title" className="minifig-prompt__title">
        {t('minifigPrompt.title')}
      </h2>
      <p>
        {t('minifigPrompt.text')}
        {prompt.missing > 0 && <> {tc('minifigPrompt.missing', prompt.missing)}</>}
      </p>
      <div className="minifig-prompt__actions">
        {(['yes', 'no'] as const).map((answer) => (
          <Form key={answer} route="account.minifig_prompt">
            {({ processing }) => (
              <>
                <input type="hidden" name="answer" value={answer} />
                <button
                  type="submit"
                  className={answer === 'yes' ? 'btn' : 'btn btn--secondary'}
                  disabled={processing}
                >
                  {t(answer === 'yes' ? 'minifigPrompt.yes' : 'minifigPrompt.no')}
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
