import { usePage } from '@inertiajs/react'
import NavLink from '~/components/nav_link'
import { useI18n } from '~/i18n'

/**
 * The catalogue sections and the news of the month. Sets and minifigs lead back to the last
 * filtered list of the visit.
 */
export default function PrimaryNav({ className }: { className: string }) {
  const { props } = usePage()
  const { t } = useI18n()
  return (
    <ul className={className}>
      <li>
        <NavLink route="sets.index" href={props.catalogueUrls.sets} className="primary-nav__link">
          {t('nav.sets')}
        </NavLink>
      </li>
      <li>
        <NavLink
          route="minifigs.index"
          href={props.catalogueUrls.minifigs}
          className="primary-nav__link"
        >
          {t('nav.minifigs')}
        </NavLink>
      </li>
      <li>
        <NavLink route="themes.index" className="primary-nav__link">
          {t('nav.themes')}
        </NavLink>
      </li>
      <li>
        <NavLink route="news.current" className="primary-nav__link">
          {t('nav.news')}
        </NavLink>
      </li>
    </ul>
  )
}
