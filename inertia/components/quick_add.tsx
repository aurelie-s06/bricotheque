import { useEffect, useRef } from 'react'
import { usePage } from '@inertiajs/react'
import { Form } from '@adonisjs/inertia/react'
import { Plus, X } from 'lucide-react'
import { useI18n } from '~/i18n'

/**
 * "+ Ajouter par numéros" button and its window: adds many sets at once by
 * typing their numbers ("75192, 10294 42115"), to the collection or to the
 * wishlist. After sending, the window opens again with the result (numbers
 * not found included).
 */
export default function QuickAdd({ status }: { status: 'owned' | 'wanted' }) {
  const { t, tc } = useI18n()
  const { flash } = usePage()
  const result = flash?.quickAdd?.status === status ? flash.quickAdd : null
  const dialog = useRef<HTMLDialogElement>(null)
  const id = `quick-add-${status}`

  // The page came back after sending: show the result in the window
  useEffect(() => {
    if (result && dialog.current && !dialog.current.open) dialog.current.showModal()
  }, [result])

  return (
    <>
      <button
        type="button"
        className="btn btn--secondary"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <Plus size={18} aria-hidden="true" /> {t('quickAdd.open')}
      </button>

      <dialog ref={dialog} className="modal" aria-labelledby={`${id}-title`}>
        <div className="modal__header">
          <h2 id={`${id}-title`} className="modal__title">
            {status === 'owned' ? t('quickAdd.titleOwned') : t('quickAdd.titleWanted')}
          </h2>
          <button
            type="button"
            className="modal__close"
            onClick={() => dialog.current?.close()}
            title={t('quickAdd.close')}
          >
            <X size={20} aria-hidden="true" />
            <span className="visually-hidden">{t('quickAdd.close')}</span>
          </button>
        </div>

        {result && (
          <div className="quick-add__result" role="status">
            <p>
              <strong>{tc('quickAdd.added', result.added)}</strong>
              {result.minifigs > 0 && <> {tc('quickAdd.minifigs', result.minifigs)}</>}
              {result.alreadyThere > 0 && (
                <> · {tc('quickAdd.alreadyThere', result.alreadyThere)}</>
              )}
            </p>
            {result.unknown.length > 0 && (
              <p>
                {tc('quickAdd.unknown', result.unknown.length)}{' '}
                <span className="quick-add__unknown">{result.unknown.join(', ')}</span>
              </p>
            )}
          </div>
        )}

        <Form
          route="collection.quick_add"
          className="quick-add__form"
          resetOnSuccess
          options={{ preserveScroll: true }}
        >
          {({ errors: formErrors, processing }) => {
            const errors = formErrors as Record<string, string | undefined>
            return (
              <>
                <input type="hidden" name="status" value={status} />
                <label className="field__label" htmlFor={id}>
                  {t('quickAdd.label')}
                </label>
                <p className="field__hint" id={`${id}-hint`}>
                  {t('quickAdd.hint')}
                </p>
                <textarea
                  id={id}
                  name="numbers"
                  className="field__input quick-add__input"
                  rows={4}
                  required
                  spellCheck={false}
                  autoComplete="off"
                  placeholder="75192, 10294, 42115"
                  aria-describedby={errors.numbers ? `${id}-hint ${id}-error` : `${id}-hint`}
                  aria-invalid={errors.numbers ? 'true' : undefined}
                />
                {errors.numbers && (
                  <p id={`${id}-error`} className="field__error">
                    {errors.numbers}
                  </p>
                )}
                <div className="modal__actions">
                  <button type="submit" className="btn" disabled={processing}>
                    {processing ? t('form.saving') : t('quickAdd.submit')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => dialog.current?.close()}
                  >
                    {t('quickAdd.close')}
                  </button>
                </div>
              </>
            )
          }}
        </Form>
      </dialog>
    </>
  )
}
