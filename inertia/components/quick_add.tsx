import { usePage } from '@inertiajs/react'
import { Form } from '@adonisjs/inertia/react'
import { useI18n } from '~/i18n'

/**
 * Adds many sets at once by typing their numbers ("75192, 10294 42115"),
 * to the collection or to the wishlist. The result stays shown above the
 * form (numbers not found included) until the next page.
 */
export default function QuickAdd({ status }: { status: 'owned' | 'wanted' }) {
  const { t, tc } = useI18n()
  const { flash } = usePage()
  const result = flash?.quickAdd?.status === status ? flash.quickAdd : null

  return (
    <details className="card quick-add" open={Boolean(result)}>
      <summary className="quick-add__summary">
        {status === 'owned' ? t('quickAdd.titleOwned') : t('quickAdd.titleWanted')}
      </summary>

      {result && (
        <div className="quick-add__result" role="status">
          <p>
            <strong>{tc('quickAdd.added', result.added)}</strong>
            {result.minifigs > 0 && <> {tc('quickAdd.minifigs', result.minifigs)}</>}
            {result.alreadyThere > 0 && <> · {tc('quickAdd.alreadyThere', result.alreadyThere)}</>}
          </p>
          {result.unknown.length > 0 && (
            <p>
              {tc('quickAdd.unknown', result.unknown.length)}{' '}
              <span className="quick-add__unknown">{result.unknown.join(', ')}</span>
            </p>
          )}
        </div>
      )}

      <Form route="collection.quick_add" className="quick-add__form" resetOnSuccess>
        {({ errors: formErrors, processing }) => {
          const errors = formErrors as Record<string, string | undefined>
          return (
            <>
              <input type="hidden" name="status" value={status} />
              <label className="field__label" htmlFor={`quick-add-${status}`}>
                {t('quickAdd.label')}
              </label>
              <p className="field__hint" id={`quick-add-${status}-hint`}>
                {t('quickAdd.hint')}
              </p>
              <textarea
                id={`quick-add-${status}`}
                name="numbers"
                className="field__input quick-add__input"
                rows={3}
                required
                spellCheck={false}
                autoComplete="off"
                placeholder="75192, 10294, 42115"
                aria-describedby={
                  errors.numbers
                    ? `quick-add-${status}-hint quick-add-${status}-error`
                    : `quick-add-${status}-hint`
                }
                aria-invalid={errors.numbers ? 'true' : undefined}
              />
              {errors.numbers && (
                <p id={`quick-add-${status}-error`} className="field__error">
                  {errors.numbers}
                </p>
              )}
              <div>
                <button type="submit" className="btn" disabled={processing}>
                  {processing ? t('form.saving') : t('quickAdd.submit')}
                </button>
              </div>
            </>
          )
        }}
      </Form>
    </details>
  )
}
