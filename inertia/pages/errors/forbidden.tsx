import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import { useI18n } from '~/i18n'

export default function Forbidden() {
  const { t } = useI18n()
  return (
    <>
      <Seo title={t('error.forbiddenTitle')} />
      <Breadcrumb
        items={[{ name: t('breadcrumb.home'), url: '/' }, { name: t('error.forbiddenTitle') }]}
      />
      <div className="empty-state">
        <div className="studs" aria-hidden="true" />
        <h1>{t('error.forbiddenTitle')}</h1>
        <p className="text-muted">{t('error.forbiddenText')}</p>
        <p>
          <Link route="home" className="btn">
            {t('error.backHome')}
          </Link>{' '}
          <Link href="/plan-du-site" className="btn btn--secondary">
            {t('footer.siteMap')}
          </Link>
        </p>
      </div>
    </>
  )
}

Forbidden.layout = [AppLayout]
