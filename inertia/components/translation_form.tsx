import { Form, Link } from '@adonisjs/inertia/react'
import { Copy } from 'lucide-react'
import { displaySetNum } from '~/lib/set_number'
import { notify } from '~/lib/notify'
import { useI18n } from '~/i18n'

export type TranslationItem = {
  id: number
  setNum: string
  name: string
  url: string
  description: string
  descriptionFr: string
}

/**
 * One set to translate: the English text on the left, the French text to
 * type on the right, saved with its own button.
 */
export default function TranslationForm({ item }: { item: TranslationItem }) {
  const { t } = useI18n()
  const fieldId = `translation-${item.id}`

  /** Copies the whole English text at once, to paste it into a translator */
  async function copyEnglish() {
    try {
      await navigator.clipboard.writeText(item.description)
      notify(t('admin.translations.copied'))
    } catch {
      notify(t('admin.translations.copyFailed'), 'error')
    }
  }

  return (
    <article className="card translation" aria-labelledby={`${fieldId}-title`}>
      <h2 className="translation__title" id={`${fieldId}-title`}>
        <Link href={item.url}>
          {displaySetNum(item.setNum)} {item.name}
        </Link>
        {item.descriptionFr && (
          <span className="translation__done"> · {t('admin.translations.isDone')}</span>
        )}
      </h2>
      <div className="translation__columns">
        <div>
          <div className="translation__label-row">
            <p className="field__label" id={`${fieldId}-en-label`}>
              {t('admin.translations.english')}
            </p>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={copyEnglish}
              aria-describedby={`${fieldId}-en-label`}
            >
              <Copy size={16} aria-hidden="true" /> {t('admin.translations.copy')}
            </button>
          </div>
          <div
            className="translation__english"
            lang="en"
            tabIndex={0}
            role="region"
            aria-labelledby={`${fieldId}-en-label`}
          >
            {item.description.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
        <Form
          route="admin.translations.update"
          routeParams={{ id: item.id }}
          className="translation__form"
          options={{ preserveScroll: true }}
        >
          {({ processing }) => (
            <>
              <label className="field__label" htmlFor={fieldId}>
                {t('admin.translations.french')}
              </label>
              <p className="field__hint" id={`${fieldId}-hint`}>
                {t('admin.translations.frenchHint')}
              </p>
              <textarea
                id={fieldId}
                name="descriptionFr"
                className="field__input translation__textarea"
                rows={8}
                defaultValue={item.descriptionFr}
                aria-describedby={`${fieldId}-hint`}
              />
              <div>
                <button type="submit" className="btn" disabled={processing}>
                  {processing ? t('form.saving') : t('admin.translations.save')}
                </button>
              </div>
            </>
          )}
        </Form>
      </div>
    </article>
  )
}
