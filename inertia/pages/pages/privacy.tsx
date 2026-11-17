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

const COOKIES = [
  {
    name: 'adonis-session',
    fr: 'Garde votre session ouverte (connexion, messages de confirmation).',
    en: 'Keeps your session open (login, confirmation messages).',
    durationFr: '2 heures d’inactivité',
    durationEn: '2 hours of inactivity',
  },
  {
    name: 'XSRF-TOKEN',
    fr: 'Protège les formulaires contre les envois frauduleux depuis un autre site.',
    en: 'Protects forms against forged submissions from another site.',
    durationFr: '2 heures',
    durationEn: '2 hours',
  },
  {
    name: 'locale',
    fr: 'Retient la langue choisie (français ou anglais).',
    en: 'Remembers the chosen language (French or English).',
    durationFr: '1 an',
    durationEn: '1 year',
  },
]

export default function Privacy({ contact, host }: Props) {
  const { t, locale } = useI18n()
  const fr = locale === 'fr'

  return (
    <InfoPage title={t('footer.privacy')} description={t('pages.privacyDescription')}>
      <h2>{fr ? 'Responsable du traitement' : 'Data controller'}</h2>
      <p>
        <Filled value={contact.publisher} />
        {fr ? ', éditeur du site (voir les ' : ', publisher of the site (see the '}
        <Link href="/mentions-legales">{t('footer.legal')}</Link>).
      </p>

      <h2>{fr ? 'Données collectées' : 'Data collected'}</h2>
      <p>
        {fr
          ? 'Sans compte, le site ne collecte aucune donnée personnelle : pas de publicité, pas de mesure d’audience, pas de traceur tiers.'
          : 'Without an account, the site collects no personal data: no ads, no analytics, no third-party trackers.'}
      </p>
      <p>{fr ? 'Avec un compte, le site enregistre :' : 'With an account, the site stores:'}</p>
      <ul>
        <li>
          {fr
            ? 'votre pseudo et votre adresse e-mail, pour vous identifier et vous écrire (confirmation du compte, mot de passe oublié) ;'
            : 'your username and email address, to identify you and write to you (account confirmation, forgotten password);'}
        </li>
        <li>
          {fr
            ? 'votre mot de passe, sous forme chiffrée (personne ne peut le lire, même pas l’éditeur) ;'
            : 'your password, hashed (nobody can read it, not even the publisher);'}
        </li>
        <li>
          {fr
            ? 'votre collection et votre wishlist (sets, minifigs, quantités, état).'
            : 'your collection and wishlist (sets, minifigs, quantities, condition).'}
        </li>
      </ul>
      <p>
        {fr
          ? 'Base légale : l’exécution du service que vous demandez en créant un compte. Ces données ne sont ni vendues, ni partagées, ni utilisées à des fins publicitaires. Elles sont stockées en France chez '
          : 'Legal basis: providing the service you ask for when creating an account. This data is never sold, shared or used for advertising. It is stored in France by '}
        <ExternalLink href={host.url}>{host.name}</ExternalLink>
        {fr
          ? '. Elles sont conservées tant que le compte existe.'
          : '. It is kept as long as the account exists.'}
      </p>
      <p>
        {fr
          ? 'Votre wishlist n’est visible par d’autres personnes que si vous activez son partage ; le lien de partage peut être désactivé à tout moment.'
          : 'Your wishlist is only visible to others if you turn on sharing; the share link can be turned off at any time.'}
      </p>

      <h2 id="droits">{fr ? 'Vos droits' : 'Your rights'}</h2>
      <p>
        {fr
          ? 'Vous disposez d’un droit d’accès, de rectification, de portabilité et d’effacement de vos données :'
          : 'You have the right to access, correct, export and delete your data:'}
      </p>
      <ul>
        <li>
          {fr
            ? 'modifier votre pseudo, e-mail et mot de passe : page '
            : 'change your username, email and password: '}
          <Link href="/mon-compte">{t('account.title')}</Link> ;
        </li>
        <li>
          {fr
            ? 'supprimer votre compte et toutes ses données, immédiatement et définitivement : page '
            : 'delete your account and all its data, immediately and permanently: '}
          <Link href="/mon-compte">{t('account.title')}</Link>.
        </li>
      </ul>
      <p>
        {fr
          ? 'Pour toute autre demande, écrivez-nous (réponse sous 30 jours au plus) :'
          : 'For any other request, write to us (answer within 30 days at most):'}
      </p>
      <ContactList contact={contact} />
      <p>
        {fr
          ? 'Vous pouvez aussi adresser une réclamation à la '
          : 'You can also lodge a complaint with the '}
        <ExternalLink href="https://www.cnil.fr/">
          {fr ? 'CNIL' : 'CNIL (French data protection authority)'}
        </ExternalLink>
        .
      </p>

      <h2 id="cookies">Cookies</h2>
      <p>
        {fr
          ? 'Le site n’utilise que des cookies nécessaires à son fonctionnement ; ils ne demandent donc pas de consentement. Si vous les bloquez, vous pourrez consulter le catalogue, mais pas vous connecter ni envoyer de formulaire, et la langue choisie ne sera pas retenue.'
          : 'The site only uses cookies needed for it to work, so they do not require consent. If you block them, you can browse the catalogue but not log in or send forms, and your language choice will not be remembered.'}
      </p>
      <table className="data-table">
        <caption>{fr ? 'Cookies déposés par le site' : 'Cookies set by the site'}</caption>
        <thead>
          <tr>
            <th scope="col">{fr ? 'Nom' : 'Name'}</th>
            <th scope="col">{fr ? 'Rôle' : 'Purpose'}</th>
            <th scope="col">{fr ? 'Durée' : 'Duration'}</th>
          </tr>
        </thead>
        <tbody>
          {COOKIES.map((cookie) => (
            <tr key={cookie.name}>
              <th scope="row">
                <code>{cookie.name}</code>
              </th>
              <td>{fr ? cookie.fr : cookie.en}</td>
              <td>{fr ? cookie.durationFr : cookie.durationEn}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="field__hint">
        {fr
          ? 'Un cookie de session technique supplémentaire, au nom aléatoire, accompagne le cookie adonis-session.'
          : 'An extra technical session cookie, with a random name, comes with the adonis-session cookie.'}
      </p>
    </InfoPage>
  )
}

Privacy.layout = [AppLayout]
