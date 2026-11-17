import { Form, Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import { useI18n } from '~/i18n'

export default function Login() {
  const { t } = useI18n()
  return (
    <div className="card auth-card">
      <Seo title={t('auth.loginTitle')} />
      <h1>{t('auth.loginTitle')}</h1>
      <p className="text-muted">{t('auth.loginLead')}</p>

      <Form route="session.store" style={{ marginTop: 'var(--space-3)' }}>
        {({ errors, processing }) => (
          <>
            <div className="field">
              <label className="field__label" htmlFor="email">
                {t('auth.email')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="field__input"
                autoComplete="email"
                required
                aria-invalid={errors.email ? 'true' : undefined}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <span id="email-error" className="field__error">
                  {errors.email}
                </span>
              )}
            </div>

            <div className="field">
              <label className="field__label" htmlFor="password">
                {t('auth.password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className="field__input"
                autoComplete="current-password"
                required
                aria-invalid={errors.password ? 'true' : undefined}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <span id="password-error" className="field__error">
                  {errors.password}
                </span>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn--block" disabled={processing}>
                {processing ? t('auth.loggingIn') : t('auth.login')}
              </button>
            </div>
          </>
        )}
      </Form>

      <p className="auth-card__foot">
        {t('auth.noAccount')} <Link route="new_account.create">{t('auth.createAccount')}</Link>
      </p>
    </div>
  )
}

Login.layout = [AppLayout]
