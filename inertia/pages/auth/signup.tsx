import { Form, Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import FormField from '~/components/form_field'
import FormAlert from '~/components/form_alert'
import { useI18n } from '~/i18n'

export default function Signup() {
  const { t } = useI18n()
  return (
    <>
      <Breadcrumb
        items={[{ name: t('breadcrumb.home'), url: '/' }, { name: t('auth.signupTitle') }]}
      />
      <div className="card auth-card">
        <Seo title={t('auth.signupTitle')} />
        <h1>{t('auth.signupTitle')}</h1>
        <p className="text-muted">{t('auth.signupLead')}</p>
        <p className="field__hint">{t('auth.signupConfirmNotice')}</p>

        <Form
          route="new_account.store"
          className="auth-form"
          resetOnError={['password', 'passwordConfirmation']}
        >
          {({ errors, processing }) => (
            <>
              <FormAlert errors={errors} />
              <p className="field__hint">{t('form.requiredNotice')}</p>
              <FormField
                name="username"
                label={t('auth.username')}
                hint={t('auth.usernameHint')}
                autoComplete="username"
                minLength={3}
                maxLength={30}
                required
                error={errors.username}
              />
              <FormField
                name="email"
                type="email"
                label={t('auth.email')}
                hint={t('auth.emailHint')}
                autoComplete="email"
                required
                error={errors.email}
              />
              <FormField
                name="password"
                type="password"
                label={t('auth.password')}
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
                label={t('auth.passwordConfirmation')}
                autoComplete="new-password"
                required
                error={errors.passwordConfirmation}
              />
              <div className="form-actions">
                <button type="submit" className="btn btn--block" disabled={processing}>
                  {processing ? t('auth.signingUp') : t('auth.signup')}
                </button>
              </div>
            </>
          )}
        </Form>

        <p className="auth-card__foot">
          {t('auth.hasAccount')} <Link route="session.create">{t('auth.login')}</Link>
        </p>
      </div>
    </>
  )
}

Signup.layout = [AppLayout]
