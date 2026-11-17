import { usePage } from '@inertiajs/react'
import { useI18n, type Locale } from '~/i18n'

const OTHER: Record<Locale, { locale: Locale; short: string; name: string }> = {
  fr: { locale: 'en', short: 'EN', name: 'English' },
  en: { locale: 'fr', short: 'FR', name: 'Français' },
}

/**
 * One link to the other language, written in that language. A plain link
 * (full page load) so that <html lang> changes too.
 */
export default function LanguageSwitcher() {
  const { locale } = useI18n()
  const { url } = usePage()
  const other = OTHER[locale]

  return (
    <a
      href={`/langue/${other.locale}?retour=${encodeURIComponent(url)}`}
      className="icon-button language-toggle"
      lang={other.locale}
      hrefLang={other.locale}
      title={other.name}
    >
      <span aria-hidden="true">{other.short}</span>
      <span className="visually-hidden">{other.name}</span>
    </a>
  )
}
