import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'

export default function ServerError() {
  return (
    <>
      <Seo title="Erreur du serveur" />
      <div className="empty-state">
        <div className="studs" aria-hidden="true" />
        <h1>Oups, une erreur est survenue</h1>
        <p className="text-muted">
          Le serveur a rencontré un problème. Réessaie dans quelques instants.
        </p>
        <a className="btn" href="/">
          Retour à l’accueil
        </a>
      </div>
    </>
  )
}

ServerError.layout = [AppLayout]
