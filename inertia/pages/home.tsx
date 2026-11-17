import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import SetCard from '~/components/set_card'
import SearchForm from '~/components/search_form'
import { type InertiaProps } from '~/types'
import { plural } from '~/lib/format'

type Props = InertiaProps<{
  popularThemes: { name: string; url: string; count: number }[]
  latestSets: Data.BrickSet[]
}>

export default function Home({ popularThemes, latestSets }: Props) {
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

      <section aria-labelledby="themes-title" className="home-section">
        <div className="home-section__header">
          <h2 id="themes-title">Thèmes populaires</h2>
          <Link href="/themes">Tous les thèmes</Link>
        </div>
        <ul className="chip-list chip-list--large">
          {popularThemes.map((theme) => (
            <li key={theme.url}>
              <Link href={theme.url} className="chip">
                {theme.name}{' '}
                <span className="chip__count" aria-label={plural(theme.count, 'set')}>
                  {theme.count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="latest-title" className="home-section">
        <div className="home-section__header">
          <h2 id="latest-title">Derniers sets sortis</h2>
          <Link href="/sets">Tout le catalogue</Link>
        </div>
        <ul className="card-grid">
          {latestSets.map((set) => (
            <li key={set.id}>
              <SetCard set={set} />
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

Home.layout = [AppLayout]
