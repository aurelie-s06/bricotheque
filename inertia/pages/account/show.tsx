import { Form } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import FormField from '~/components/form_field'
import FlashNotice from '~/components/flash_notice'
import Breadcrumb from '~/components/breadcrumb'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{
  account: { username: string; email: string; createdAt: string; autoAddMinifigs: boolean }
}>

export default function AccountShow({ account }: Props) {
  const { t, formatDate } = useI18n()

  return (
    <>
      <Seo title={t('account.title')} />
      <Breadcrumb
        items={[{ name: t('breadcrumb.home'), url: '/' }, { name: t('account.title') }]}
      />

      <div className="page-header">
        <h1>{t('account.title')}</h1>
        <p className="text-muted">
          {t('account.memberSince', { date: formatDate(account.createdAt)! })}
        </p>
      </div>
      <FlashNotice />
      <p className="field__hint">{t('form.requiredNotice')}</p>

      <div className="account-sections">
        <section className="card account-section" aria-labelledby="profile-title">
          <h2 id="profile-title">{t('account.profile')}</h2>
          <Form
            route="account.update_profile"
            className="auth-form"
            resetOnSuccess={['currentPassword']}
          >
            {({ errors, processing }) => (
              <>
                <FormField
                  name="username"
                  label={t('auth.username')}
                  hint={t('auth.usernameHint')}
                  autoComplete="username"
                  defaultValue={account.username}
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
                  defaultValue={account.email}
                  required
                  error={errors.email}
                />
                <FormField
                  name="currentPassword"
                  type="password"
                  label={t('account.currentPassword')}
                  hint={t('account.profileHint')}
                  autoComplete="current-password"
                  error={errors.currentPassword}
                />
                <div className="form-actions">
                  <button type="submit" className="btn" disabled={processing}>
                    {processing ? t('form.saving') : t('account.saveProfile')}
                  </button>
                </div>
              </>
            )}
          </Form>
        </section>

        <section className="card account-section" aria-labelledby="preferences-title">
          <h2 id="preferences-title">{t('account.preferencesTitle')}</h2>
          <Form route="account.update_preferences" className="auth-form">
            {({ processing }) => (
              <>
                <div className="field field--checkbox">
                  <input
                    type="checkbox"
                    id="autoAddMinifigs"
                    name="autoAddMinifigs"
                    value="true"
                    defaultChecked={account.autoAddMinifigs}
                  />
                  <label htmlFor="autoAddMinifigs">{t('account.autoAddMinifigs')}</label>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn" disabled={processing}>
                    {processing ? t('form.saving') : t('account.savePreferences')}
                  </button>
                </div>
              </>
            )}
          </Form>
        </section>

        <section className="card account-section" aria-labelledby="password-title">
          <h2 id="password-title">{t('account.passwordTitle')}</h2>
          <Form route="account.update_password" className="auth-form" resetOnSuccess resetOnError>
            {({ errors, processing }) => (
              <>
                <FormField
                  name="currentPassword"
                  type="password"
                  label={t('account.currentPassword')}
                  autoComplete="current-password"
                  required
                  error={errors.currentPassword}
                />
                <FormField
                  name="password"
                  type="password"
                  label={t('auth.newPassword')}
                  hint={t('auth.passwordHint')}
                  autoComplete="new-password"
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
                  <button type="submit" className="btn" disabled={processing}>
                    {processing ? t('form.saving') : t('account.savePassword')}
                  </button>
                </div>
              </>
            )}
          </Form>
        </section>

        <section
          className="card account-section account-section--danger"
          aria-labelledby="delete-title"
        >
          <h2 id="delete-title">{t('account.deleteTitle')}</h2>
          <p>{t('account.deleteWarning')}</p>
          <details className="delete-account">
            <summary>{t('account.deleteTitle')}</summary>
            <Form route="account.destroy" className="auth-form" resetOnError={['password']}>
              {({ errors, processing }) => (
                <>
                  <div className="field field--checkbox">
                    <input type="checkbox" id="delete-understand" name="understand" required />
                    <label htmlFor="delete-understand">{t('account.deleteUnderstand')}</label>
                  </div>
                  <FormField
                    name="password"
                    type="password"
                    label={t('account.deletePassword')}
                    autoComplete="current-password"
                    required
                    error={
                      errors.password ??
                      // set by the server when the password does not match
                      (errors as Record<string, string | undefined>).deletePassword
                    }
                  />
                  <div className="form-actions">
                    <button type="submit" className="btn btn--danger" disabled={processing}>
                      {t('account.deleteButton')}
                    </button>
                  </div>
                </>
              )}
            </Form>
          </details>
        </section>
      </div>
    </>
  )
}

AccountShow.layout = [AppLayout]
