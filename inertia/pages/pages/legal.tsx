import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import InfoPage, { Filled } from '~/components/info_page'
import ExternalLink from '~/components/external_link'
import { ContactList } from '~/pages/pages/about'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Props = InertiaProps<{
  contact: {
    publisher: string | null
    contactEmail: string | null
    issuesUrl: string | null
    siteUrl: string
  }
  host: { name: string; address: string; phone: string; url: string }
}>

export default function Legal({ contact, host }: Props) {
  const { t, locale } = useI18n()
  const fr = locale === 'fr'

  return (
    <InfoPage title={t('footer.legal')} description={t('pages.legalDescription')}>
      <h2>{fr ? 'Éditeur du site' : 'Publisher'}</h2>
      <p>
        {fr
          ? 'Bricothèque est un site personnel et non commercial, édité par '
          : 'Bricothèque is a personal, non-commercial site published by '}
        <Filled value={contact.publisher} />
        {fr ? ', particulier.' : ', private individual.'}
      </p>
      <p>
        {fr ? 'Responsable de la publication : ' : 'Publication manager: '}
        <Filled value={contact.publisher} />.
      </p>

      <h2>{t('pages.contactTitle')}</h2>
      <ContactList contact={contact} />

      <h2>{fr ? 'Hébergement' : 'Hosting'}</h2>
      <p>
        <ExternalLink href={host.url}>{host.name}</ExternalLink>
        <br />
        {host.address}
        <br />
        {fr ? 'Téléphone : ' : 'Phone: '}
        <a href={`tel:${host.phone.replace(/\s/g, '')}`}>{host.phone}</a>
      </p>

      <h2>{fr ? 'Propriété intellectuelle' : 'Intellectual property'}</h2>
      <p>{t('site.legal')}</p>
      <p>
        {fr
          ? 'Les données du catalogue proviennent de Rebrickable et de Brickset, et les photos restent hébergées par Rebrickable. Voir la page '
          : 'Catalogue data comes from Rebrickable and Brickset, and the pictures stay hosted by Rebrickable. See the '}
        <Link href="/a-propos#sources">{fr ? 'À propos' : 'About page'}</Link>
        {fr
          ? ' pour le détail des sources et les conditions de réutilisation.'
          : ' for the sources and reuse conditions.'}
      </p>
      <p>
        {fr
          ? 'Vous pouvez librement faire un lien vers n’importe quelle page du site.'
          : 'You may freely link to any page of the site.'}
      </p>

      <h2>{fr ? 'Données personnelles' : 'Personal data'}</h2>
      <p>
        {fr ? 'Voir la ' : 'See the '}
        <Link href="/confidentialite">{t('footer.privacy')}</Link>
        {fr ? ' et les ' : ' and the '}
        <Link href="/conditions-utilisation">{t('footer.terms')}</Link>.
      </p>
    </InfoPage>
  )
}

Legal.layout = [AppLayout]
