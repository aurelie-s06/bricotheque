import { Form } from '@adonisjs/inertia/react'
import FormField from '~/components/form_field'
import { useI18n } from '~/i18n'

const CONDITIONS = ['built', 'in_box', 'sealed', 'partial'] as const

export type SetEntry = {
  quantity: number
  condition: string | null
  purchasePrice: number | null
  purchaseDate: string | null
  note: string | null
}

/**
 * "In my collection" panel of a set page: quantity, condition, purchase
 * price and date, note. Only shown when the set is owned.
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
      <p className="field__hint">{t('details.hint')}</p>
      <Form route="collection.set_details" routeParams={{ id: setId }} className="details-form">
        {({ errors, processing }) => (
          <>
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
            <div className="details-form__row">
              <FormField
                name="purchasePrice"
                type="number"
                label={t('details.purchasePrice')}
                hint={t('details.purchasePriceHint')}
                min={0}
                step="0.01"
                inputMode="decimal"
                defaultValue={entry.purchasePrice ?? ''}
                error={errors.purchasePrice}
              />
              <FormField
                name="purchaseDate"
                type="date"
                label={t('details.purchaseDate')}
                defaultValue={entry.purchaseDate ?? ''}
                max={new Date().toISOString().slice(0, 10)}
                error={errors.purchaseDate}
              />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="note">
                {t('details.note')}
              </label>
              <p className="field__hint" id="note-hint">
                {t('details.noteHint')}
              </p>
              <textarea
                className="field__input"
                id="note"
                name="note"
                rows={3}
                maxLength={1000}
                defaultValue={entry.note ?? ''}
                aria-describedby="note-hint"
                aria-invalid={errors.note ? 'true' : undefined}
              />
              {errors.note && <p className="field__error">{errors.note}</p>}
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
 * "In my collection" panel of a minifig page: quantity and note.
 */
export function MinifigDetailsForm({
  minifigId,
  entry,
}: {
  minifigId: number
  entry: { quantity: number; note: string | null }
}) {
  const { t } = useI18n()
  return (
    <section className="card collection-details" aria-labelledby="details-title">
      <h2 id="details-title">{t('details.title')}</h2>
      <p className="field__hint">{t('details.hint')}</p>
      <Form
        route="collection.minifig_details"
        routeParams={{ id: minifigId }}
        className="details-form"
      >
        {({ errors, processing }) => (
          <>
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
              <label className="field__label" htmlFor="note">
                {t('details.note')}
              </label>
              <p className="field__hint" id="note-hint">
                {t('details.noteHint')}
              </p>
              <textarea
                className="field__input"
                id="note"
                name="note"
                rows={3}
                maxLength={1000}
                defaultValue={entry.note ?? ''}
                aria-describedby="note-hint"
              />
              {errors.note && <p className="field__error">{errors.note}</p>}
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
