import { Form, Link } from '@adonisjs/inertia/react'
import { MailCheck } from 'lucide-react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import FormField from '~/components/form_field'
import FormAlert from '~/components/form_alert'
import FlashNotice from '~/components/flash_notice'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{ message: string | null; email: string }>

/**
 * After signup: the confirmation link has been sent. The visitor can ask
 * for a new link (expired or lost email).
 */
export default function CheckEmail({ message, email }: Props) {
  const { t } = useI18n()
  return (
    <>
      <Breadcrumb
        items={[
          { name: t('breadcrumb.home'), url: '/' },
          { name: t('auth.signupTitle'), url: '/inscription' },
          { name: t('auth.checkEmailTitle') },
        ]}
      />
      <div className="card auth-card">
        <Seo title={t('auth.checkEmailTitle')} />
        <h1>{t('auth.checkEmailTitle')}</h1>
        {message && (
          <div className="form-alert form-alert--success" role="status">
            <MailCheck size={20} aria-hidden="true" /> {message}
          </div>
        )}
        <FlashNotice />

        <h2 className="auth-card__subtitle">{t('auth.resendTitle')}</h2>
        <p className="text-muted">{t('auth.resendLead')}</p>
        <Form route="email.resend" className="auth-form">
          {({ errors, processing }) => (
            <>
              <FormAlert errors={errors} />
              <FormField
                name="email"
                type="email"
                label={t('auth.email')}
                hint={t('auth.emailHint')}
                autoComplete="email"
                defaultValue={email}
                required
                error={errors.email}
              />
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn--secondary btn--block"
                  disabled={processing}
                >
                  {processing ? t('auth.sending') : t('auth.resendSubmit')}
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

CheckEmail.layout = [AppLayout]
