import { Form } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import AdminShell from '~/components/admin_shell'
import FormField from '~/components/form_field'
import FormAlert from '~/components/form_alert'
import RequiredNotice from '~/components/required_notice'
import { type ThemeOption } from '~/components/set_filters'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Kind = 'sets' | 'minifigs'

type Props = InertiaProps<{ kind: Kind; themes: ThemeOption[] }>

export default function AdminManualCreate({ kind, themes }: Props) {
  const { t } = useI18n()
  const isSet = kind === 'sets'

  return (
    <AdminShell
      title={isSet ? t('admin.manual.addSet') : t('admin.manual.addMinifig')}
      parent={{ name: t('admin.nav.manual'), url: `/admin/ajouts?type=${kind}` }}
    >
      <p className="text-muted">
        {isSet ? t('admin.manual.createSetLead') : t('admin.manual.createMinifigLead')}
      </p>
      <Form route="admin.manual.store" routeParams={{ kind }} className="card admin-edit">
        {({ errors: formErrors, processing }) => {
          const errors = formErrors as Record<string, string | undefined>
          return (
            <>
              <FormAlert errors={errors} />
              <RequiredNotice />
              {isSet && (
                <div className="admin-edit__row">
                  <FormField
                    name="number"
                    label={t('admin.manual.number')}
                    hint={t('admin.manual.numberHint')}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={20}
                    required
                    error={errors.number}
                  />
                  <FormField
                    name="variant"
                    type="number"
                    label={t('admin.manual.variant')}
                    hint={t('admin.manual.variantHint')}
                    defaultValue="1"
                    min={1}
                    max={99}
                    required
                    error={errors.variant}
                  />
                </div>
              )}
              <FormField
                name="name"
                label={t('admin.catalogue.field.name')}
                hint={t('admin.manual.nameHint')}
                maxLength={255}
                required
                error={errors.name}
              />
              <div className="admin-edit__row">
                <FormField
                  name={isSet ? 'year' : 'yearFirst'}
                  type="number"
                  label={t('admin.catalogue.field.year')}
                  min={1949}
                  max={2100}
                  error={errors.year ?? errors.yearFirst}
                />
                <FormField
                  name="numParts"
                  type="number"
                  label={t('admin.catalogue.field.numParts')}
                  defaultValue="0"
                  min={0}
                  required
                  error={errors.numParts}
                />
              </div>
              {isSet && (
                <>
                  <div className="field">
                    <label className="field__label" htmlFor="theme">
                      {t('filters.theme')}
                      <span aria-hidden="true"> *</span>
                      <span className="visually-hidden"> ({t('form.required')})</span>
                    </label>
                    <select
                      id="theme"
                      name="theme"
                      className="field__input"
                      required
                      defaultValue=""
                      aria-invalid={errors.theme ? 'true' : undefined}
                      aria-describedby={errors.theme ? 'theme-error' : undefined}
                    >
                      <option value="" disabled>
                        {t('admin.manual.chooseTheme')}
                      </option>
                      {themes.map((theme) => (
                        <option key={theme.slug} value={theme.slug}>
                          {`${'  '.repeat(theme.depth)}${theme.depth ? '– ' : ''}${theme.name}`}
                        </option>
                      ))}
                    </select>
                    {errors.theme && (
                      <p id="theme-error" className="field__error">
                        {errors.theme}
                      </p>
                    )}
                  </div>
                  <div className="field">
                    <label className="field__label" htmlFor="description">
                      {t('admin.catalogue.field.description')}
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      lang="en"
                      className="field__input translation__textarea"
                      rows={6}
                    />
                  </div>
                </>
              )}
              <p className="text-muted">{t('admin.manual.imageHint')}</p>
              <div className="form-actions">
                <button type="submit" className="btn" disabled={processing}>
                  {processing ? t('form.saving') : t('admin.manual.createButton')}
                </button>
              </div>
            </>
          )
        }}
      </Form>
    </AdminShell>
  )
}

AdminManualCreate.layout = [AppLayout]
