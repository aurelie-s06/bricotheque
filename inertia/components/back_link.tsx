import { Link } from '@adonisjs/inertia/react'
import { useI18n } from '~/i18n'

/**
 * "← Back to results": shown on a detail page reached from a list
 * (catalogue, theme, search), with its filters and page.
 */
export default function BackLink({ href }: { href: string | null }) {
  const { t } = useI18n()
  if (!href) {
    return null
  }
  return (
    <p className="back-link">
      <Link href={href}>
        <span aria-hidden="true">← </span>
        {t('nav.backToResults')}
      </Link>
    </p>
  )
}
