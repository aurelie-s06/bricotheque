import { Form, Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import AdminShell from '~/components/admin_shell'
import FormField from '~/components/form_field'
import FormAlert from '~/components/form_alert'
import RequiredNotice from '~/components/required_notice'
import { displaySetNum } from '~/lib/set_number'
import { type InertiaProps } from '~/types'
import { useI18n, type MessageKey } from '~/i18n'

type Kind = 'sets' | 'minifigs'
type Value = string | number | null

type Props = InertiaProps<{
  item: {
    kind: Kind
    id: number
    number: string
    name: string
    url: string
    values: Record<string, Value>
    locked: string[]
  }
}>

const STATUSES = ['upcoming', 'available', 'retired', 'unknown'] as const

const asText = (value: Value | undefined) =>
  value === null || value === undefined ? '' : String(value)

export default function AdminCatalogueEdit({ item }: Props) {
  const { t } = useI18n()
  const isSet = item.kind === 'sets'
  const locked = new Set(item.locked)
  const label = (field: string) => t(`admin.catalogue.field.${field}` as MessageKey)
  /** Source of the field, and a warning when it is corrected by hand */
  const hint = (field: string, source: 'rebrickable' | 'brickset') =>
    locked.has(field)
      ? t('admin.catalogue.lockedHint')
      : t(
          source === 'rebrickable'
            ? 'admin.catalogue.fromRebrickable'
            : 'admin.catalogue.fromBrickset'
        )

  return (
    <AdminShell
      title={`${isSet ? displaySetNum(item.number) : item.number} ${item.name}`}
      parent={{ name: t('admin.nav.catalogue'), url: `/admin/catalogue?type=${item.kind}` }}
    >
      <p className="text-muted">
        {t('admin.catalogue.editLead')} <Link href={item.url}>{t('admin.catalogue.seePage')}</Link>
      </p>

      <Form
        route="admin.catalogue.update"
        routeParams={{ kind: item.kind, id: item.id }}
        className="card admin-edit"
        options={{ preserveScroll: true }}
      >
        {({ errors: formErrors, processing }) => {
          const errors = formErrors as Record<string, string | undefined>
          return (
            <>
              <FormAlert errors={errors} />
              <RequiredNotice />
              <FormField
                name="name"
                label={label('name')}
                hint={hint('name', 'rebrickable')}
                defaultValue={asText(item.values.name)}
                maxLength={255}
                required
                error={errors.name}
              />
              <div className="admin-edit__row">
                {isSet && (
                  <FormField
                    name="year"
                    type="number"
                    label={label('year')}
                    hint={hint('year', 'rebrickable')}
                    defaultValue={asText(item.values.year)}
                    min={1949}
                    max={2100}
                    error={errors.year}
                  />
                )}
                <FormField
                  name="numParts"
                  type="number"
                  label={label('numParts')}
                  hint={hint('numParts', 'rebrickable')}
                  defaultValue={asText(item.values.numParts)}
                  min={0}
                  required
                  error={errors.numParts}
                />
              </div>

              {isSet && (
                <>
                  <FormField
                    name="subtheme"
                    label={label('subtheme')}
                    hint={hint('subtheme', 'brickset')}
                    defaultValue={asText(item.values.subtheme)}
                    maxLength={255}
                    error={errors.subtheme}
                  />
                  <div className="field">
                    <label className="field__label" htmlFor="description">
                      {label('description')}
                    </label>
                    <p className="field__hint" id="description-hint">
                      {hint('description', 'brickset')}
                    </p>
                    <textarea
                      id="description"
                      name="description"
                      lang="en"
                      className="field__input translation__textarea"
                      rows={8}
                      defaultValue={asText(item.values.description)}
                      aria-describedby={
                        errors.description
                          ? 'description-hint description-error'
                          : 'description-hint'
                      }
                      aria-invalid={errors.description ? 'true' : undefined}
                    />
                    {errors.description && (
                      <p id="description-error" className="field__error">
                        {errors.description}
                      </p>
                    )}
                  </div>
                  <div className="admin-edit__row">
                    {(['rrpEur', 'rrpUsd', 'rrpGbp'] as const).map((field) => (
                      <FormField
                        key={field}
                        name={field}
                        type="number"
                        step="0.01"
                        min={0}
                        inputMode="decimal"
                        label={label(field)}
                        hint={hint(field, 'brickset')}
                        defaultValue={asText(item.values[field])}
                        error={errors[field]}
                      />
                    ))}
                  </div>
                  <div className="admin-edit__row">
                    {(['dateFirstAvailable', 'dateLastAvailable'] as const).map((field) => (
                      <FormField
                        key={field}
                        name={field}
                        type="date"
                        label={label(field)}
                        hint={hint(field, 'brickset')}
                        defaultValue={asText(item.values[field])}
                        error={errors[field]}
                      />
                    ))}
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor="availabilityStatus">
                      {label('availabilityStatus')}
                    </label>
                    <p className="field__hint" id="availabilityStatus-hint">
                      {locked.has('availabilityStatus')
                        ? t('admin.catalogue.lockedHint')
                        : t('admin.catalogue.statusHint')}
                    </p>
                    <select
                      id="availabilityStatus"
                      name="availabilityStatus"
                      className="field__input"
                      aria-describedby="availabilityStatus-hint"
                      defaultValue={
                        locked.has('availabilityStatus')
                          ? asText(item.values.availabilityStatus)
                          : 'auto'
                      }
                    >
                      <option value="auto">
                        {t('admin.catalogue.statusAuto', {
                          status: t(`status.${item.values.availabilityStatus}` as MessageKey),
                        })}
                      </option>
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {t(`status.${status}` as MessageKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="form-actions">
                <button type="submit" className="btn" disabled={processing}>
                  {processing ? t('form.saving') : t('admin.catalogue.save')}
                </button>
              </div>
            </>
          )
        }}
      </Form>

      {item.locked.length > 0 && (
        <section className="card admin-edit" aria-labelledby="release-title">
          <h2 id="release-title">{t('admin.catalogue.releaseTitle')}</h2>
          <p className="text-muted">{t('admin.catalogue.releaseLead')}</p>
          <Form
            route="admin.catalogue.release"
            routeParams={{ kind: item.kind, id: item.id }}
            options={{ preserveScroll: true }}
          >
            {({ processing }) => (
              <>
                <fieldset className="admin-edit__fields">
                  <legend className="field__label">{t('admin.catalogue.releaseLegend')}</legend>
                  {item.locked.map((field) => (
                    <div key={field} className="field field--checkbox">
                      <input
                        type="checkbox"
                        id={`release-${field}`}
                        name="fields[]"
                        value={field}
                      />
                      <label htmlFor={`release-${field}`}>{label(field)}</label>
                    </div>
                  ))}
                </fieldset>
                <div className="form-actions">
                  <button type="submit" className="btn btn--secondary" disabled={processing}>
                    {t('admin.catalogue.releaseButton')}
                  </button>
                </div>
              </>
            )}
          </Form>
        </section>
      )}
    </AdminShell>
  )
}

AdminCatalogueEdit.layout = [AppLayout]
