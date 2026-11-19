import { Link } from '@adonisjs/inertia/react'
import { type Data } from '@generated/data'
import AppLayout from '~/layouts/app'
import Seo from '~/components/seo'
import SetCard from '~/components/set_card'
import SearchForm from '~/components/search_form'
import { thumbnailOf } from '~/components/set_image'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Showcase = {
  counts: { sets: number; minifigs: number; themes: number }
  mosaic: string[]
  themes: { name: string; url: string; count: number; image: string | null }[]
}

type Props = InertiaProps<{
  showcase: Showcase
  announcements: Data.BrickSet[]
}>

export default function Home({ showcase, announcements }: Props) {
  const { t, tc, tn, dateNode, formatNumber } = useI18n()
  return (
    <>
      <Seo />

      <section className="hero" aria-labelledby="hero-title">
        {showcase.mosaic.length > 0 && (
          // Decorative: the latest sets, faded behind the text
          <div className="hero__mosaic" aria-hidden="true">
            {showcase.mosaic.map((src) => (
              <img
                key={src}
                src={thumbnailOf(src) ?? src}
                alt=""
                loading="lazy"
                decoding="async"
                width={250}
                height={250}
              />
            ))}
          </div>
        )}
        <div className="hero__content">
          <h1 id="hero-title">{t('home.title')}</h1>
          <p className="hero__lead">{t('home.lead')}</p>
          <SearchForm />
          <ul className="hero__figures">
            <li>
              <strong>{formatNumber(showcase.counts.sets)}</strong> {t('home.figureSets')}
            </li>
            <li>
              <strong>{formatNumber(showcase.counts.minifigs)}</strong> {t('home.figureMinifigs')}
            </li>
            <li>
              <strong>{formatNumber(showcase.counts.themes)}</strong> {t('home.figureThemes')}
            </li>
          </ul>
        </div>
      </section>

      {showcase.themes.length > 0 && (
        <section aria-labelledby="themes-title" className="home-section">
          <div className="home-section__header">
            <h2 id="themes-title">{t('home.bigThemes')}</h2>
            <Link href="/themes">{t('home.allThemes')}</Link>
          </div>
          <ul className="theme-tiles">
            {showcase.themes.map((theme) => (
              <li key={theme.url}>
                <Link href={theme.url} className="theme-tile">
                  <span className="theme-tile__media">
                    {theme.image && (
                      <img
                        src={thumbnailOf(theme.image) ?? theme.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        width={250}
                        height={250}
                      />
                    )}
                  </span>
                  <span className="theme-tile__name">{theme.name}</span>
                  <span className="theme-tile__count">{tc('count.sets', theme.count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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
    </>
  )
}

Home.layout = [AppLayout]
