import { Link } from '@adonisjs/inertia/react'
import { useI18n } from '~/i18n'

/**
 * The "B" brick: a yellow B whose two loops carry a stud, on a dark brick.
 * Same drawing as public/favicon.svg. Decorative: the name next to it is
 * the text of the link.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      className="logo__mark"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2" y="4" width="60" height="58" rx="10" fill="#1F2328" />
      <rect x="2" y="2" width="60" height="56" rx="10" fill="#2B3036" />
      <path d="M18 12h16a10 10 0 0 1 0 20a10 10 0 0 1 0 20H18z" fill="#D9961A" />
      <path d="M18 10h16a10 10 0 0 1 0 20a10 10 0 0 1 0 20H18z" fill="#F2B11F" />
      <circle cx="34" cy="20" r="5" fill="#F9D36B" />
      <circle cx="34" cy="40" r="5" fill="#F9D36B" />
    </svg>
  )
}

export default function Logo() {
  const { t } = useI18n()
  return (
    <Link route="home" className="logo" aria-label={t('site.homeLabel')}>
      <LogoMark />
      <span className="logo__name">Bricothèque</span>
    </Link>
  )
}
