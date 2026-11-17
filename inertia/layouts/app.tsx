import { type ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import { Form } from '@adonisjs/inertia/react'
import Logo from '~/components/logo'
import NavLink from '~/components/nav_link'
import SearchForm from '~/components/search_form'
import FlashToasts from '~/components/flash_toasts'
import LanguageSwitcher from '~/components/language_switcher'
import { useI18n } from '~/i18n'

/**
 * Main site layout: skip link, header (logo, search, menu, language),
 * main content and footer with the legal notice.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { props, url } = usePage()
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

          <SearchForm
            key={currentQuery}
            defaultValue={currentQuery}
            className="site-header__search"
            buttonClassName="btn btn--sm"
          />

          <nav className="site-nav" aria-label={t('site.mainMenu')}>
            <ul className="site-nav__list">
              <li>
                <NavLink
                  route="sets.index"
                  href={props.catalogueUrls.sets}
                  className="site-nav__link"
                >
                  {t('nav.sets')}
                </NavLink>
              </li>
              <li>
                <NavLink
                  route="minifigs.index"
                  href={props.catalogueUrls.minifigs}
                  className="site-nav__link"
                >
                  {t('nav.minifigs')}
                </NavLink>
              </li>
              <li>
                <NavLink route="themes.index" className="site-nav__link">
                  {t('nav.themes')}
                </NavLink>
              </li>
              {props.user ? (
                <li>
                  <Form route="session.destroy">
                    <button type="submit" className="btn btn--secondary btn--sm">
                      {t('nav.logout')}
                    </button>
                  </Form>
                </li>
              ) : (
                <>
                  <li>
                    <NavLink route="session.create" className="site-nav__link">
                      {t('nav.login')}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink route="new_account.create" className="site-nav__link">
                      {t('nav.signup')}
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>

          <LanguageSwitcher />
        </div>
      </header>

      <main id="contenu" className="site-main" tabIndex={-1}>
        <div className="container">{children}</div>
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <div className="studs" aria-hidden="true" />
          <p>{t('site.legal')}</p>
          <p>© {new Date().getFullYear()} Briquothèque</p>
        </div>
      </footer>

      <FlashToasts />
    </>
  )
}
