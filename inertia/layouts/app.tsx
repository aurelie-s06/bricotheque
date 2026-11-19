import { type ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import Logo from '~/components/logo'
import PrimaryNav from '~/components/header/primary_nav'
import AccountMenu from '~/components/header/account_menu'
import MobileMenu from '~/components/header/mobile_menu'
import SearchForm from '~/components/search_form'
import Toaster from '~/components/toaster'
import MinifigPrompt from '~/components/minifig_prompt'
import LanguageSwitcher from '~/components/language_switcher'
import { useI18n } from '~/i18n'

/**
 * Main site layout: skip link, header (logo, search, menu, language),
 * main content and footer with the legal notice.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { url } = usePage()
  const { t } = useI18n()
  const currentQuery = new URLSearchParams(url.split('?')[1] ?? '').get('q') ?? ''

  return (
    <>
      <a className="skip-link" href="#contenu">
        {t('site.skipLink')}
      </a>

      <header className="site-header">
        <div className="container site-header__inner">
          <Logo />

          <nav className="primary-nav" aria-label={t('site.mainMenu')}>
            <PrimaryNav className="primary-nav__list" />
          </nav>

          <SearchForm
            key={currentQuery}
            defaultValue={currentQuery}
            className="site-header__search"
            compact
          />

          <div className="site-header__actions">
            <LanguageSwitcher />
            <AccountMenu />
            <MobileMenu />
          </div>
        </div>
      </header>

      <main id="contenu" className="site-main" tabIndex={-1}>
        <div className="container">
          <MinifigPrompt />
          {children}
        </div>
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <div className="studs" aria-hidden="true" />
          <nav aria-label={t('footer.nav')}>
            <ul className="site-footer__links">
              <li>
                <Link href="/a-propos">{t('footer.about')}</Link>
              </li>
              <li>
                <Link href="/a-propos#contact">{t('footer.contact')}</Link>
              </li>
              <li>
                <Link href="/plan-du-site">{t('footer.siteMap')}</Link>
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
          </nav>
          <p>
            {t('site.legal')} <Link href="/a-propos#sources">{t('site.reuse')}</Link>
          </p>
          <p>© {new Date().getFullYear()} Bricothèque</p>
        </div>
      </footer>

      <Toaster />
    </>
  )
}
