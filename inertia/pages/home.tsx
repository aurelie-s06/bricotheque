import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import SearchForm from '~/components/search_form'

export default function Home() {
  return (
    <>
      <Seo />

      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">Tous les sets et minifigs, une seule collection</h1>
        <p className="hero__lead">
          Retrouve n’importe quel set ou minifig, d’hier comme d’aujourd’hui, et garde la trace de
          ta collection et de tes envies.
        </p>
        <SearchForm />
      </section>

      <hr className="section-divider studs studs--muted" />

      <div className="empty-state">
        <div className="studs" aria-hidden="true" />
        <h2>Le catalogue arrive bientôt</h2>
        <p className="text-muted">
          Les sets et minifigs seront importés lors des prochaines étapes.
        </p>
      </div>
    </>
  )
}

Home.layout = [AppLayout]
