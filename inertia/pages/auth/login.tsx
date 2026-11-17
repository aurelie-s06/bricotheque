import { Form, Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import FormField from '~/components/form_field'
import FormAlert from '~/components/form_alert'
import FlashNotice from '~/components/flash_notice'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{ notice: string | null }>

export default function Login({ notice }: Props) {
  const { t } = useI18n()
  return (
    <>
      <Breadcrumb
        items={[{ name: t('breadcrumb.home'), url: '/' }, { name: t('auth.loginTitle') }]}
      />
      <div className="card auth-card">
        <Seo title={t('auth.loginTitle')} />
        <h1>{t('auth.loginTitle')}</h1>
        <p className="text-muted">{t('auth.loginLead')}</p>
        <p className="field__hint">{t('auth.sessionNotice')}</p>
        <FlashNotice />
        {notice && (
          <div className="form-alert" role="status">
            {notice}
          </div>
        )}

        <Form route="session.store" className="auth-form" resetOnError={['password']}>
          {({ errors, processing }) => (
            <>
              <FormAlert errors={errors} />
              <p className="field__hint">{t('form.requiredNotice')}</p>
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
                hint={t('auth.caseSensitive')}
                autoComplete="current-password"
                required
                error={errors.password}
              />
              <p>
                <Link route="password.forgot">{t('auth.forgotLink')}</Link>
              </p>
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
    </>
  )
}

Login.layout = [AppLayout]
