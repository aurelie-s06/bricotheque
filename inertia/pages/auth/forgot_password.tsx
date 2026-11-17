import { Form, Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import FormField from '~/components/form_field'
import FormAlert from '~/components/form_alert'
import { useI18n } from '~/i18n'

export default function ForgotPassword() {
  const { t } = useI18n()
  return (
    <>
      <Breadcrumb
        items={[{ name: t('breadcrumb.home'), url: '/' }, { name: t('auth.forgotTitle') }]}
      />
      <div className="card auth-card">
        <Seo title={t('auth.forgotTitle')} />
        <h1>{t('auth.forgotTitle')}</h1>
        <p className="text-muted">{t('auth.forgotLead')}</p>

        <Form route="password.send" className="auth-form">
          {({ errors, processing }) => (
            <>
              <FormAlert errors={errors} />
              <FormField
                name="email"
                type="email"
                label={t('auth.email')}
                hint={t('auth.emailHint')}
                autoComplete="email"
                required
                error={errors.email}
              />
              <div className="form-actions">
                <button type="submit" className="btn btn--block" disabled={processing}>
                  {processing ? t('auth.sending') : t('auth.forgotSubmit')}
                </button>
              </div>
            </>
          )}
        </Form>

        <p className="auth-card__foot">
          <Link route="session.create">{t('auth.backToLogin')}</Link>
        </p>
      </div>
    </>
  )
}

ForgotPassword.layout = [AppLayout]
