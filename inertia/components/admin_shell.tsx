import { type ReactNode } from 'react'
import { usePage } from '@inertiajs/react'
import { Link } from '@adonisjs/inertia/react'
import { Image, Languages, LayoutDashboard, RefreshCw, Users } from 'lucide-react'
import Seo from '~/components/seo'
import { useI18n } from '~/i18n'

const ITEMS = [
  { href: '/admin', label: 'admin.nav.dashboard', icon: LayoutDashboard },
  { href: '/admin/images', label: 'admin.nav.images', icon: Image },
  { href: '/admin/traductions', label: 'admin.nav.translations', icon: Languages },
  { href: '/admin/mises-a-jour', label: 'admin.nav.updates', icon: RefreshCw },
  { href: '/admin/utilisateurs', label: 'admin.nav.users', icon: Users },
] as const

/**
 * Frame of the back office pages: same look as the site, a menu on the
 * left (above on a phone) and the page content.
 */
export default function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useI18n()
  const { url } = usePage()
  const path = url.split('?')[0]

  return (
    <div className="admin">
      <Seo title={`${title} – ${t('admin.title')}`} />
      <nav className="admin__nav" aria-label={t('admin.navLabel')}>
        <p className="admin__brand">{t('admin.title')}</p>
        <ul>
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const current = href === '/admin' ? path === '/admin' : path.startsWith(href)
            return (
              <li key={label}>
                <Link
                  href={href}
                  className="admin__link"
                  aria-current={current ? 'page' : undefined}
                >
                  <Icon size={18} aria-hidden="true" /> {t(label)}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="admin__content">
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  )
}
