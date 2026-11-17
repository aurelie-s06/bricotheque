import { type ReactNode } from 'react'
import { useI18n } from '~/i18n'

/**
 * Link to another website, announced as such (visually and to screen readers).
 */
export default function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  const { t } = useI18n()
  return (
    <a href={href} className="external-link" rel="noopener noreferrer">
      {children}
      <span aria-hidden="true"> ↗</span>
      <span className="visually-hidden"> {t('external.label')}</span>
    </a>
  )
}
