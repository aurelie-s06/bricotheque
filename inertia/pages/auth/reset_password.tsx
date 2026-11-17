import { Form, Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import FormField from '~/components/form_field'
import RequiredNotice from '~/components/required_notice'
import FormAlert from '~/components/form_alert'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{ token: string; valid: boolean }>

export default function ResetPassword({ token, valid }: Props) {
  const { t } = useI18n()

  if (!valid) {
    return (
      <div className="card auth-card">
        <Seo title={t('auth.resetInvalidTitle')} />
        <h1>{t('auth.resetInvalidTitle')}</h1>
        <p>{t('auth.resetInvalidText')}</p>
        <p className="form-actions">
          <Link route="password.forgot" className="btn">
            {t('auth.resetNewRequest')}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <>
      <Breadcrumb
        items={[{ name: t('breadcrumb.home'), url: '/' }, { name: t('auth.resetTitle') }]}
      />
      <div className="card auth-card">
        <Seo title={t('auth.resetTitle')} />
        <h1>{t('auth.resetTitle')}</h1>
        <p className="text-muted">{t('auth.resetLead')}</p>

        <Form route="password.update" routeParams={{ token }} className="auth-form" resetOnError>
          {({ errors, processing }) => (
            <>
              <FormAlert errors={errors} />
              <RequiredNotice />
              <FormField
                name="password"
                type="password"
                label={t('auth.newPassword')}
                hint={t('auth.passwordHint')}
                autoComplete="new-password"
                strengthMeter
                minLength={10}
                required
                error={errors.password}
              />
              <FormField
                name="passwordConfirmation"
                type="password"
                label={t('auth.newPasswordConfirmation')}
                autoComplete="new-password"
                required
                error={errors.passwordConfirmation}
              />
              <div className="form-actions">
                <button type="submit" className="btn btn--block" disabled={processing}>
                  {processing ? t('form.saving') : t('auth.resetSubmit')}
                </button>
              </div>
            </>
          )}
        </Form>
      </div>
    </>
  )
}

ResetPassword.layout = [AppLayout]
