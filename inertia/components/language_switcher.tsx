import { usePage } from '@inertiajs/react'
import { useI18n, type Locale } from '~/i18n'

const LANGUAGES: { locale: Locale; short: string }[] = [
  { locale: 'fr', short: 'FR' },
  { locale: 'en', short: 'EN' },
]

/**
 * FR / EN switch. Plain links (full page load, so <html lang> changes
 * too), each written in its own language.
 */
export default function LanguageSwitcher() {
  const { t, locale } = useI18n()
  const { url } = usePage()

  return (
    <ul className="language-switcher" aria-label={t('language.label')}>
      {LANGUAGES.map((language) => {
        const name = t(`language.${language.locale}`)
        return (
          <li key={language.locale}>
            <a
              href={`/langue/${language.locale}?retour=${encodeURIComponent(url)}`}
              className="language-switcher__link"
              lang={language.locale}
              hrefLang={language.locale}
              aria-current={language.locale === locale ? 'true' : undefined}
              title={name}
            >
              <span aria-hidden="true">{language.short}</span>
              <span className="visually-hidden">{name}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
