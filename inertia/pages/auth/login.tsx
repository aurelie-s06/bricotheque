import { Form, Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'

export default function Login() {
  return (
    <div className="card auth-card">
      <Seo title="Connexion" />
      <h1>Connexion</h1>
      <p className="text-muted">Retrouve ta collection et ta wishlist.</p>

      <Form route="session.store" style={{ marginTop: 'var(--space-3)' }}>
        {({ errors, processing }) => (
          <>
            <div className="field">
              <label className="field__label" htmlFor="email">
                Adresse e-mail
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
                Mot de passe
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
                {processing ? 'Connexion…' : 'Se connecter'}
              </button>
            </div>
          </>
        )}
      </Form>

      <p className="auth-card__foot">
        Pas encore de compte ? <Link route="new_account.create">Créer un compte</Link>
      </p>
    </div>
  )
}

Login.layout = [AppLayout]
