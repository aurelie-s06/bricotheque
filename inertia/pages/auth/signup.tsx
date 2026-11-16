import { Form, Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'

const fields = [
  {
    name: 'username',
    label: 'Pseudo',
    type: 'text',
    autoComplete: 'username',
    required: true,
  },
  { name: 'email', label: 'Adresse e-mail', type: 'email', autoComplete: 'email', required: true },
  {
    name: 'password',
    label: 'Mot de passe',
    type: 'password',
    autoComplete: 'new-password',
    required: true,
  },
  {
    name: 'passwordConfirmation',
    label: 'Confirmer le mot de passe',
    type: 'password',
    autoComplete: 'new-password',
    required: true,
  },
] as const

export default function Signup() {
  return (
    <div className="card auth-card">
      <Seo title="Inscription" />
      <h1>Inscription</h1>
      <p className="text-muted">Crée ton compte pour gérer ta collection.</p>

      <Form route="new_account.store" style={{ marginTop: 'var(--space-3)' }}>
        {({ errors, processing }) => (
          <>
            {fields.map((field) => {
              const error = errors[field.name]
              return (
                <div className="field" key={field.name}>
                  <label className="field__label" htmlFor={field.name}>
                    {field.label}
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
                {processing ? 'Création…' : 'Créer mon compte'}
              </button>
            </div>
          </>
        )}
      </Form>

      <p className="auth-card__foot">
        Déjà un compte ? <Link route="session.create">Se connecter</Link>
      </p>
    </div>
  )
}

Signup.layout = [AppLayout]
