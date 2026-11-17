import { Menu, X } from 'lucide-react'
import PrimaryNav from '~/components/header/primary_nav'
import { useDismissableDetails } from '~/components/header/use_dismiss'
import { useI18n } from '~/i18n'

/**
 * Small screens: the catalogue sections in a "Menu" dropdown.
 */
export default function MobileMenu() {
  const { t } = useI18n()
  const menu = useDismissableDetails()
  return (
    <details className="dropdown mobile-menu" ref={menu}>
      <summary className="icon-button mobile-menu__toggle">
        <Menu size={22} aria-hidden="true" className="mobile-menu__open" />
        <X size={22} aria-hidden="true" className="mobile-menu__close" />
        <span className="mobile-menu__label">{t('nav.menu')}</span>
      </summary>
      <nav className="dropdown__panel mobile-menu__panel" aria-label={t('site.mainMenu')}>
        <PrimaryNav className="dropdown__list" />
      </nav>
    </details>
  )
}
