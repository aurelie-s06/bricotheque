import { type ReactNode } from 'react'
import { Form } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import FormField from '~/components/form_field'
import FormAlert from '~/components/form_alert'
import RequiredNotice from '~/components/required_notice'
import SharePanel from '~/components/share_panel'
import Breadcrumb from '~/components/breadcrumb'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{
  account: { username: string; email: string; createdAt: string; autoAddMinifigs: boolean }
  shareUrl: string | null
}>

/** One card of the page: a title, an optional text and its own form */
function AccountCard({
  id,
  title,
  lead,
  danger = false,
  children,
}: {
  id: string
  title: string
  lead?: string
  danger?: boolean
  children: ReactNode
}) {
  return (
    <section
      className={`card account-section${danger ? ' account-section--danger' : ''}`}
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`}>{title}</h2>
      {lead && <p className="text-muted account-section__lead">{lead}</p>}
      {children}
    </section>
  )
}

/** Submit button, under the fields it saves */
function SaveButton({
  processing,
  label,
  danger = false,
}: {
  processing: boolean
  label: string
  danger?: boolean
}) {
  const { t } = useI18n()
  return (
    <div className="form-actions account-section__actions">
      <button type="submit" className={`btn${danger ? ' btn--danger' : ''}`} disabled={processing}>
        {processing ? t('form.saving') : label}
      </button>
    </div>
  )
}

/**
 * Account page: stacked cards, one form per action (username, email,
 * password, preferences, shared wishlist), then the account deletion,
 * apart at the bottom and confirmed.
 */
export default function AccountShow({ account, shareUrl }: Props) {
  const { t, tn, dateNode } = useI18n()

  return (
    <>
      <Seo title={t('account.title')} />
      <Breadcrumb
        items={[{ name: t('breadcrumb.home'), url: '/' }, { name: t('account.title') }]}
      />

      <div className="page-header">
        <h1>{t('account.title')}</h1>
        <p className="text-muted">
          {tn('account.memberSince', { date: dateNode(account.createdAt) })}
        </p>
      </div>

      <div className="account-sections">
        <AccountCard id="username" title={t('account.usernameTitle')}>
          <Form route="account.update_username" className="account-form">
            {({ errors, processing }) => (
              <>
                <FormAlert errors={errors} />
                <RequiredNotice />
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
                <SaveButton processing={processing} label={t('account.saveUsername')} />
              </>
            )}
          </Form>
        </AccountCard>

        <AccountCard id="email" title={t('account.emailTitle')} lead={t('account.emailLead')}>
          <Form
            route="account.update_email"
            className="account-form"
            resetOnSuccess={['currentPassword']}
            resetOnError={['currentPassword']}
          >
            {({ errors, processing }) => (
              <>
                <FormAlert errors={errors} />
                <RequiredNotice />
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
                  id="email-currentPassword"
                  type="password"
                  label={t('account.currentPassword')}
                  autoComplete="current-password"
                  required
                  error={errors.currentPassword}
                />
                <SaveButton processing={processing} label={t('account.saveEmail')} />
              </>
            )}
          </Form>
        </AccountCard>

        <AccountCard id="password" title={t('account.passwordTitle')}>
          <Form
            route="account.update_password"
            className="account-form"
            resetOnSuccess
            resetOnError
          >
            {({ errors, processing }) => (
              <>
                <FormAlert errors={errors} />
                <RequiredNotice />
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
                <SaveButton processing={processing} label={t('account.savePassword')} />
              </>
            )}
          </Form>
        </AccountCard>

        <AccountCard id="preferences" title={t('account.preferencesTitle')}>
          <Form route="account.update_preferences" className="account-form">
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
                <SaveButton processing={processing} label={t('account.savePreferences')} />
              </>
            )}
          </Form>
        </AccountCard>

        <SharePanel shareUrl={shareUrl} />
      </div>

      <div className="account-danger-zone">
        <AccountCard
          id="delete"
          title={t('account.deleteTitle')}
          lead={t('account.deleteWarning')}
          danger
        >
          <Form route="account.destroy" className="account-form" resetOnError={['password']}>
            {({ errors, processing }) => (
              <>
                <FormAlert errors={errors} />
                <RequiredNotice />
                <div className="field field--checkbox">
                  <input type="checkbox" id="delete-understand" name="understand" required />
                  <label htmlFor="delete-understand">
                    {t('account.deleteUnderstand')}
                    <span aria-hidden="true"> *</span>
                  </label>
                </div>
                <FormField
                  name="password"
                  id="delete-password"
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
                <SaveButton processing={processing} label={t('account.deleteButton')} danger />
              </>
            )}
          </Form>
        </AccountCard>
      </div>
    </>
  )
}

AccountShow.layout = [AppLayout]
