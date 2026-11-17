import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import SetCard from '~/components/set_card'
import SearchForm from '~/components/search_form'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{
  latestSets: Data.BrickSet[]
}>

export default function Home({ latestSets }: Props) {
  const { t } = useI18n()
  return (
    <>
      <Seo />

      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">{t('home.title')}</h1>
        <p className="hero__lead">{t('home.lead')}</p>
        <SearchForm />
      </section>

      <hr className="section-divider studs studs--muted" />

      <section aria-labelledby="latest-title" className="home-section">
        <div className="home-section__header">
          <h2 id="latest-title">{t('home.latestSets')}</h2>
          <Link href="/sets">{t('home.allSets')}</Link>
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
