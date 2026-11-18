import { Link } from '@adonisjs/inertia/react'
import { useI18n } from '~/i18n'

/**
 * Provisional text logo. Replace the content of this component with the
 * final logo (e.g. an <img> from public/images/) when it is ready.
 */
export default function Logo() {
  const { t } = useI18n()
  return (
    <Link route="home" className="logo" aria-label={t('site.homeLabel')}>
      Bricothèque
    </Link>
  )
}
