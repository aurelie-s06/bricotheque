import { usePage } from '@inertiajs/react'
import { Form, Link } from '@adonisjs/inertia/react'
import { ChartBar, ChevronDown, Heart, LibraryBig, LogOut, Settings, UserRound } from 'lucide-react'
import { useI18n } from '~/i18n'
import { useDismissableDetails } from '~/components/header/use_dismiss'

/**
 * Visitors: one "Log in" button (signing up is offered on the login page).
 * Members: a badge with their initial that opens the account menu.
 */
export default function AccountMenu() {
  const { props } = usePage()
  const { t } = useI18n()
  const menu = useDismissableDetails()

  if (!props.user) {
    return (
      <Link route="session.create" className="btn btn--sm header-login">
        {t('nav.login')}
      </Link>
    )
  }

  const username = props.user.username
  return (
    <details className="dropdown account-menu" ref={menu}>
      <summary className="account-menu__toggle">
        <span className="account-menu__avatar" aria-hidden="true">
          {username.charAt(0).toUpperCase()}
        </span>
        <span className="account-menu__name">{username}</span>
        <span className="visually-hidden">{t('nav.accountMenu')}</span>
        <ChevronDown size={16} aria-hidden="true" className="dropdown__chevron" />
      </summary>
      <div className="dropdown__panel">
        <p className="dropdown__heading" aria-hidden="true">
          {username}
        </p>
        <ul className="dropdown__list">
          <li>
            <Link route="dashboard" className="dropdown__item">
              <ChartBar size={18} aria-hidden="true" />
              {t('nav.dashboard')}
            </Link>
          </li>
          <li>
            <Link route="collection.index" className="dropdown__item">
              <LibraryBig size={18} aria-hidden="true" />
              {t('nav.collection')}
            </Link>
          </li>
          <li>
            <Link route="wishlist.index" className="dropdown__item">
              <Heart size={18} aria-hidden="true" />
              {t('nav.wishlist')}
            </Link>
          </li>
          <li>
            <Link route="account.show" className="dropdown__item">
              <UserRound size={18} aria-hidden="true" />
              {t('nav.account')}
            </Link>
          </li>
          {props.user.isAdmin && (
            <li>
              <Link route="admin.dashboard" className="dropdown__item">
                <Settings size={18} aria-hidden="true" />
                {t('admin.title')}
              </Link>
            </li>
          )}
          <li>
            <Form route="session.destroy">
              <button type="submit" className="dropdown__item">
                <LogOut size={18} aria-hidden="true" />
                {t('nav.logout')}
              </button>
            </Form>
          </li>
        </ul>
      </div>
    </details>
  )
}
