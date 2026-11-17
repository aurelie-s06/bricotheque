import { type ReactNode } from 'react'
import { useI18n, type Locale } from '~/i18n'

/**
 * Link to another website, announced as such (visually and to screen
 * readers). `lang` gives the language of the target page when it differs
 * from the current one (Opquast rule 131). It opens in the same window.
 */
export default function ExternalLink({
  href,
  lang,
  children,
}: {
  href: string
  lang?: Locale
  children: ReactNode
}) {
  const { t, locale } = useI18n()
  const otherLanguage = lang && lang !== locale ? t(`external.lang.${lang}`) : null
  return (
    <a href={href} className="external-link" rel="noopener noreferrer" hrefLang={lang}>
      {children}
      {otherLanguage && <span className="external-link__lang"> ({otherLanguage})</span>}
      <span aria-hidden="true"> ↗</span>
      <span className="visually-hidden"> {t('external.label')}</span>
    </a>
  )
}
