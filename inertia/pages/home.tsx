import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import SetCard from '~/components/set_card'
import SearchForm from '~/components/search_form'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{
  announcements: Data.BrickSet[]
  latestSets: Data.BrickSet[]
}>

export default function Home({ announcements, latestSets }: Props) {
  const { t, tn, dateNode } = useI18n()
  return (
    <>
      <Seo />

      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">{t('home.title')}</h1>
        <p className="hero__lead">{t('home.lead')}</p>
        <SearchForm />
      </section>

      <hr className="section-divider studs studs--muted" />

      {announcements.length > 0 && (
        <section aria-labelledby="announcements-title" className="home-section">
          <div className="home-section__header">
            <h2 id="announcements-title">{t('home.announcements')}</h2>
            <Link href="/sets?status=upcoming&sort=release">{t('home.allAnnouncements')}</Link>
          </div>
          <ul className="card-grid">
            {announcements.map((set) => (
              <li key={set.id}>
                <SetCard
                  set={set}
                  note={
                    set.releaseDate
                      ? tn('home.releaseOn', { date: dateNode(set.releaseDate) })
                      : t('home.releaseTbc')
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="latest-title" className="home-section">
        <div className="home-section__header">
          <h2 id="latest-title">{t('home.latestSets')}</h2>
          <Link href="/nouveautes">{t('home.newsOfTheMonth')}</Link>
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
