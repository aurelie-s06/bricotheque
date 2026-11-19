import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import InfoPage from '~/components/info_page'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{ themes: { name: string; url: string }[] }>

export default function SiteMap({ themes, user }: Props) {
  const { t } = useI18n()

  return (
    <InfoPage title={t('footer.siteMap')} description={t('pages.siteMapDescription')}>
      <h2>{t('pages.siteMapCatalogue')}</h2>
      <ul>
        <li>
          <Link href="/">{t('breadcrumb.home')}</Link>
        </li>
        <li>
          <Link href="/sets">{t('sets.title')}</Link>
        </li>
        <li>
          <Link href="/minifigs">{t('minifigs.title')}</Link>
        </li>
        <li>
          <Link href="/themes">{t('themes.title')}</Link>
          <ul className="site-map__themes">
            {themes.map((theme) => (
              <li key={theme.url}>
                <Link href={theme.url}>{theme.name}</Link>
              </li>
            ))}
          </ul>
        </li>
        <li>
          <Link href="/nouveautes">{t('nav.news')}</Link>
        </li>
        <li>
          <Link href="/recherche">{t('search.title')}</Link>
        </li>
      </ul>

      <h2>{t('pages.siteMapAccount')}</h2>
      <ul>
        {user ? (
          <>
            <li>
              <Link href="/tableau-de-bord">{t('dashboard.title')}</Link>
            </li>
            <li>
              <Link href="/ma-collection">{t('collection.title')}</Link>
            </li>
            <li>
              <Link href="/ma-wishlist">{t('wishlist.title')}</Link>
            </li>
            <li>
              <Link href="/mon-compte">{t('account.title')}</Link>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link href="/connexion">{t('auth.loginTitle')}</Link>
            </li>
            <li>
              <Link href="/inscription">{t('auth.signupTitle')}</Link>
            </li>
            <li>
              <Link href="/mot-de-passe-oublie">{t('auth.forgotTitle')}</Link>
            </li>
          </>
        )}
      </ul>

      <h2>{t('pages.siteMapInfo')}</h2>
      <ul>
        <li>
          <Link href="/a-propos">{t('pages.aboutTitle')}</Link>
        </li>
        <li>
          <Link href="/mentions-legales">{t('footer.legal')}</Link>
        </li>
        <li>
          <Link href="/confidentialite">{t('footer.privacy')}</Link>
        </li>
        <li>
          <Link href="/conditions-utilisation">{t('footer.terms')}</Link>
        </li>
      </ul>
    </InfoPage>
  )
}

SiteMap.layout = [AppLayout]
