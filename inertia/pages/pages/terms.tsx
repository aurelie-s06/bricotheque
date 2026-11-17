import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import InfoPage from '~/components/info_page'
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
}>

export default function Terms({ contact }: Props) {
  const { t, locale } = useI18n()
  const fr = locale === 'fr'

  return (
    <InfoPage title={t('footer.terms')} description={t('pages.termsDescription')}>
      <h2>{fr ? 'Le service' : 'The service'}</h2>
      <p>
        {fr
          ? 'Briquothèque est un catalogue gratuit. La consultation est libre et sans compte. Un compte gratuit permet de gérer une collection et une wishlist. Le site ne vend rien et n’affiche pas de publicité.'
          : 'Briquothèque is a free catalogue. Browsing is open and needs no account. A free account lets you manage a collection and a wishlist. Nothing is sold and no ads are shown.'}
      </p>

      <h2>{fr ? 'Votre compte' : 'Your account'}</h2>
      <ul>
        <li>
          {fr
            ? 'Vous devez confirmer votre adresse e-mail pour activer le compte.'
            : 'You must confirm your email address to activate the account.'}
        </li>
        <li>
          {fr
            ? 'Vous êtes responsable de votre mot de passe ; choisissez-en un que vous n’utilisez nulle part ailleurs.'
            : 'You are responsible for your password; choose one you do not use anywhere else.'}
        </li>
        <li>
          {fr
            ? 'Le pseudo est visible des personnes à qui vous partagez votre wishlist : évitez d’y mettre votre nom complet ou un terme injurieux.'
            : 'Your username is visible to people you share your wishlist with: avoid your full name or offensive words.'}
        </li>
        <li>
          {fr
            ? 'Vous pouvez fermer votre compte à tout moment depuis la page '
            : 'You can close your account at any time from '}
          <Link href="/mon-compte">{t('account.title')}</Link>.
        </li>
      </ul>

      <h2>{fr ? 'Fiabilité des informations' : 'Accuracy of information'}</h2>
      <p>
        {fr
          ? 'Les informations du catalogue (prix d’origine, dates, nombre de pièces) proviennent de sources communautaires et sont données à titre indicatif. Elles peuvent contenir des erreurs : signalez-les-nous.'
          : 'Catalogue information (original prices, dates, piece counts) comes from community sources and is given for information only. It may contain errors: please report them.'}
      </p>

      <h2>{fr ? 'Disponibilité' : 'Availability'}</h2>
      <p>
        {fr
          ? 'Le site est un projet personnel : il peut être interrompu pour maintenance ou modifié sans préavis. Pensez à exporter votre collection régulièrement.'
          : 'The site is a personal project: it may be interrupted for maintenance or changed without notice. Remember to export your collection regularly.'}
      </p>

      <h2>{fr ? 'Litiges et contact' : 'Disputes and contact'}</h2>
      <p>
        {fr
          ? 'Ces conditions sont soumises au droit français. En cas de désaccord, écrivez-nous d’abord pour trouver une solution amiable :'
          : 'These terms are governed by French law. In case of disagreement, please write to us first to find an amicable solution:'}
      </p>
      <ContactList contact={contact} />
      <p>
        {fr ? 'Voir aussi la ' : 'See also the '}
        <Link href="/confidentialite">{t('footer.privacy')}</Link>.
      </p>
    </InfoPage>
  )
}

Terms.layout = [AppLayout]
