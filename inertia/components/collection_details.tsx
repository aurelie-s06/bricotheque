import { Form } from '@adonisjs/inertia/react'
import FormField from '~/components/form_field'
import { useI18n } from '~/i18n'

const CONDITIONS = ['built', 'in_box', 'sealed', 'partial'] as const

export type SetEntry = { quantity: number; condition: string | null }

/**
 * "In my collection" panel of a set page: quantity and condition. Only
 * shown when the set is owned.
 */
export function SetDetailsForm({
  setId,
  entry,
  hasMinifigs,
}: {
  setId: number
  entry: SetEntry
  hasMinifigs: boolean
}) {
  const { t } = useI18n()
  return (
    <section className="card collection-details" aria-labelledby="details-title">
      <h2 id="details-title">{t('details.title')}</h2>
      <Form route="collection.set_details" routeParams={{ id: setId }} className="details-form">
        {({ errors, processing }) => (
          <>
            <p className="field__hint">{t('form.requiredNotice')}</p>
            <div className="details-form__row">
              <FormField
                name="quantity"
                type="number"
                label={t('details.quantity')}
                min={1}
                max={999}
                defaultValue={entry.quantity}
                required
                error={errors.quantity}
              />
              <div className="field">
                <label className="field__label" htmlFor="condition">
                  {t('details.condition')}
                </label>
                <select
                  className="field__input"
                  id="condition"
                  name="condition"
                  defaultValue={entry.condition ?? ''}
                  aria-invalid={errors.condition ? 'true' : undefined}
                >
                  <option value="">{t('details.noCondition')}</option>
                  {CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>
                      {t(`condition.${condition}`)}
                    </option>
                  ))}
                </select>
                {errors.condition && <p className="field__error">{errors.condition}</p>}
              </div>
            </div>
            <div className="form-actions details-form__actions">
              <button type="submit" className="btn" disabled={processing}>
                {processing ? t('form.saving') : t('details.save')}
              </button>
            </div>
          </>
        )}
      </Form>
      {hasMinifigs && (
        <Form
          route="collection.add_set_minifigs"
          routeParams={{ id: setId }}
          className="details-form__minifigs"
        >
          {({ processing }) => (
            <button type="submit" className="btn btn--secondary btn--sm" disabled={processing}>
              {t('details.addSetMinifigs')}
            </button>
          )}
        </Form>
      )}
    </section>
  )
}

/**
 * "In my collection" panel of a minifig page: quantity.
 */
export function MinifigDetailsForm({
  minifigId,
  entry,
}: {
  minifigId: number
  entry: { quantity: number }
}) {
  const { t } = useI18n()
  return (
    <section className="card collection-details" aria-labelledby="details-title">
      <h2 id="details-title">{t('details.title')}</h2>
      <Form
        route="collection.minifig_details"
        routeParams={{ id: minifigId }}
        className="details-form"
      >
        {({ errors, processing }) => (
          <>
            <p className="field__hint">{t('form.requiredNotice')}</p>
            <div className="details-form__row">
              <FormField
                name="quantity"
                type="number"
                label={t('details.quantity')}
                min={1}
                max={999}
                defaultValue={entry.quantity}
                required
                error={errors.quantity}
              />
            </div>
            <div className="form-actions details-form__actions">
              <button type="submit" className="btn" disabled={processing}>
                {processing ? t('form.saving') : t('details.save')}
              </button>
            </div>
          </>
        )}
      </Form>
    </section>
  )
}
