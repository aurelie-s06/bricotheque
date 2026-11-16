import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'

export default function NotFound() {
  return (
    <>
      <Seo title="Page introuvable" />
      <div className="empty-state">
        <div className="studs" aria-hidden="true" />
        <h1>Page introuvable</h1>
        <p className="text-muted">La page demandée n’existe pas ou a été déplacée.</p>
        <Link route="home" className="btn">
          Retour à l’accueil
        </Link>
      </div>
    </>
  )
}

NotFound.layout = [AppLayout]
