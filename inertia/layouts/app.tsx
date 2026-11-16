import { type ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import { Form } from '@adonisjs/inertia/react'
import Logo from '~/components/logo'
import NavLink from '~/components/nav_link'
import SearchForm from '~/components/search_form'
import FlashToasts from '~/components/flash_toasts'

/**
 * Main site layout: skip link, header (logo, search, account links),
 * main content and footer with the legal notice.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { props, url } = usePage()
  const currentQuery = new URLSearchParams(url.split('?')[1] ?? '').get('q') ?? ''

  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
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

          <nav className="site-nav" aria-label="Menu principal">
            <ul className="site-nav__list">
              {props.user ? (
                <li>
                  <Form route="session.destroy">
                    <button type="submit" className="btn btn--secondary btn--sm">
                      Déconnexion
                    </button>
                  </Form>
                </li>
              ) : (
                <>
                  <li>
                    <NavLink route="session.create" className="site-nav__link">
                      Connexion
                    </NavLink>
                  </li>
                  <li>
                    <NavLink route="new_account.create" className="site-nav__link">
                      Inscription
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <main id="contenu" className="site-main" tabIndex={-1}>
        <div className="container">{children}</div>
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <div className="studs" aria-hidden="true" />
          <p>
            LEGO® est une marque du groupe LEGO, qui ne parraine ni n’approuve ce site. Données :
            Rebrickable, Brickset.
          </p>
          <p>© {new Date().getFullYear()} Briquothèque</p>
        </div>
      </footer>

      <FlashToasts />
    </>
  )
}
