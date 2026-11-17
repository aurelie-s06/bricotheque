import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import Breadcrumb from '~/components/breadcrumb'
import { useI18n } from '~/i18n'

export default function ServerError() {
  const { t } = useI18n()
  return (
    <>
      <Seo title={t('error.serverPageTitle')} />
      <Breadcrumb
        items={[{ name: t('breadcrumb.home'), url: '/' }, { name: t('error.serverPageTitle') }]}
      />
      <div className="empty-state">
        <div className="studs" aria-hidden="true" />
        <h1>{t('error.serverTitle')}</h1>
        <p className="text-muted">{t('error.serverText')}</p>
        <a className="btn" href="/">
          {t('error.backHome')}
        </a>
      </div>
    </>
  )
}

ServerError.layout = [AppLayout]
