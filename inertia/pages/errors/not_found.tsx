import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import { useI18n } from '~/i18n'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <>
      <Seo title={t('error.notFoundTitle')} />
      <div className="empty-state">
        <div className="studs" aria-hidden="true" />
        <h1>{t('error.notFoundTitle')}</h1>
        <p className="text-muted">{t('error.notFoundText')}</p>
        <Link route="home" className="btn">
          {t('error.backHome')}
        </Link>
      </div>
    </>
  )
}

NotFound.layout = [AppLayout]
