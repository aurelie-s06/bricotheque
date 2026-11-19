import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import SearchForm from '~/components/search_form'
import { useI18n } from '~/i18n'
import Mascot from '~/components/mascot'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <>
      <Seo title={t('error.notFoundTitle')} />
      <Breadcrumb
        items={[{ name: t('breadcrumb.home'), url: '/' }, { name: t('error.notFoundTitle') }]}
      />
      <div className="empty-state">
        <Mascot variant="lost" />
        <h1>{t('error.notFoundTitle')}</h1>
        <p className="text-muted">{t('error.notFoundText')}</p>
        <SearchForm className="error-search" />
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

NotFound.layout = [AppLayout]
