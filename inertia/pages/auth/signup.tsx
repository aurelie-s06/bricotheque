import { Form, Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import { useI18n, type MessageKey } from '~/i18n'

const fields = [
  {
    name: 'username',
    label: 'auth.username',
    type: 'text',
    autoComplete: 'username',
    required: true,
  },
  { name: 'email', label: 'auth.email', type: 'email', autoComplete: 'email', required: true },
  {
    name: 'password',
    label: 'auth.password',
    type: 'password',
    autoComplete: 'new-password',
    required: true,
  },
  {
    name: 'passwordConfirmation',
    label: 'auth.passwordConfirmation',
    type: 'password',
    autoComplete: 'new-password',
    required: true,
  },
] as const

export default function Signup() {
  const { t } = useI18n()
  return (
    <div className="card auth-card">
      <Seo title={t('auth.signupTitle')} />
      <h1>{t('auth.signupTitle')}</h1>
      <p className="text-muted">{t('auth.signupLead')}</p>

      <Form route="new_account.store" style={{ marginTop: 'var(--space-3)' }}>
        {({ errors, processing }) => (
          <>
            {fields.map((field) => {
              const error = errors[field.name]
              return (
                <div className="field" key={field.name}>
                  <label className="field__label" htmlFor={field.name}>
                    {t(field.label as MessageKey)}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    className="field__input"
                    autoComplete={field.autoComplete}
                    required={field.required}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? `${field.name}-error` : undefined}
                  />
                  {error && (
                    <span id={`${field.name}-error`} className="field__error">
                      {error}
                    </span>
                  )}
                </div>
              )
            })}

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
  )
}

Signup.layout = [AppLayout]
