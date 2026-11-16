import { Link } from '@adonisjs/inertia/react'

/**
 * Provisional text logo. Replace the content of this component with the
 * final logo (e.g. an <img> from public/images/) when it is ready.
 */
export default function Logo() {
  return (
    <Link route="home" className="logo" aria-label="Briquothèque – Accueil">
      Briquothèque
    </Link>
  )
}
