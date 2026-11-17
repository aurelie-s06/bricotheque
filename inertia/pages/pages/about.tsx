import { Link } from '@adonisjs/inertia/react'
import AppLayout from '~/layouts/app'
import InfoPage from '~/components/info_page'
import ExternalLink from '~/components/external_link'
import { type InertiaProps } from '~/types'
import { useI18n } from '~/i18n'

type Contact = {
  publisher: string | null
  contactEmail: string | null
  issuesUrl: string | null
  siteUrl: string
}

type Props = InertiaProps<{
  contact: Contact
  catalogueUpdates: { rebrickable: string | null; brickset: string | null }
}>

/** Date of the last import, readable and machine-readable */
function UpdateDate({ value }: { value: string | null }) {
  const { t, dateNode } = useI18n()
  return value ? dateNode(value) : t('pages.unknownDate')
}

export function ContactList({ contact }: { contact: Contact }) {
  const { t } = useI18n()
  return (
    <ul>
      <li>
        {t('pages.contactEmail')}{' '}
        {contact.contactEmail ? (
          <a href={`mailto:${contact.contactEmail}`}>{contact.contactEmail}</a>
        ) : (
          <mark>{t('pages.toComplete')}</mark>
        )}
      </li>
      <li>
        {t('pages.contactIssues')}{' '}
        {contact.issuesUrl ? (
          <ExternalLink href={contact.issuesUrl} lang="en">
            {t('pages.contactIssuesLink')}
          </ExternalLink>
        ) : (
          <mark>{t('pages.toComplete')}</mark>
        )}
      </li>
    </ul>
  )
}

export default function About({ contact, catalogueUpdates }: Props) {
  const { t, locale } = useI18n()
  const fr = locale === 'fr'

  return (
    <InfoPage title={t('pages.aboutTitle')} description={t('pages.aboutDescription')}>
      <h2>{fr ? 'Le site' : 'The site'}</h2>
      <p>
        {fr
          ? 'Briquothèque est un catalogue gratuit et non commercial de sets et de minifigs de briques de construction. Il permet de chercher un set, de consulter sa fiche, puis, avec un compte, de suivre sa collection et sa liste d’envies (wishlist). Le site ne vend rien.'
          : 'Briquothèque is a free, non-commercial catalogue of building brick sets and minifigs. You can search for a set, read its page and, with an account, keep track of your collection and wishlist. Nothing is sold on this site.'}
      </p>

      <h2 id="sources">{fr ? 'Sources des données' : 'Data sources'}</h2>
      <ul>
        <li>
          <ExternalLink href="https://rebrickable.com/downloads/" lang="en">
            Rebrickable
          </ExternalLink>{' '}
          {fr
            ? '— sets, minifigs, thèmes, nombre de pièces et photos (les photos restent hébergées par Rebrickable). Dernière mise à jour : '
            : '— sets, minifigs, themes, piece counts and pictures (pictures stay hosted by Rebrickable). Last update: '}
          <UpdateDate value={catalogueUpdates.rebrickable} />.
        </li>
        <li>
          <ExternalLink href="https://brickset.com/" lang="en">
            Brickset
          </ExternalLink>{' '}
          {fr
            ? '— prix d’origine, dates de commercialisation et descriptions. Dernière mise à jour : '
            : '— original prices, dates on sale and descriptions. Last update: '}
          <UpdateDate value={catalogueUpdates.brickset} />.
        </li>
        <li>
          {fr
            ? 'Les descriptions françaises sont des traductions automatiques (Claude, d’Anthropic) des textes de Brickset ; le texte original reste consultable sur chaque fiche.'
            : 'French descriptions are machine translations (Claude, by Anthropic) of the Brickset texts; the original text is available on each page.'}
        </li>
      </ul>
      <p>
        {fr
          ? 'Les données sont reprises conformément aux conditions d’utilisation de ces services. Les textes et photos appartiennent à leurs auteurs : adressez-vous à eux avant toute réutilisation.'
          : 'The data is used under the terms of these services. Texts and pictures belong to their authors: please ask them before any reuse.'}
      </p>
      <p>{t('site.legal')}</p>

      <h2 id="glossaire">{fr ? 'Glossaire' : 'Glossary'}</h2>
      <dl className="glossary">
        <dt>Set</dt>
        <dd>
          {fr
            ? 'Boîte de construction vendue sous un numéro (ex. 75192-1 : numéro du set, puis numéro de version).'
            : 'Construction box sold under a number (e.g. 75192-1: set number, then version number).'}
        </dd>
        <dt>Minifig</dt>
        <dd>
          {fr
            ? 'Petit personnage articulé, souvent inclus dans les sets.'
            : 'Small jointed figure, often included in sets.'}
        </dd>
        <dt>{fr ? 'Thème' : 'Theme'}</dt>
        <dd>
          {fr
            ? 'Gamme à laquelle appartient un set (ex. Star Wars, City), parfois divisée en sous-thèmes.'
            : 'Range a set belongs to (e.g. Star Wars, City), sometimes split into subthemes.'}
        </dd>
        <dt>{fr ? 'Retiré' : 'Retired'}</dt>
        <dd>
          {fr
            ? 'Set qui n’est plus vendu par le fabricant ; on ne le trouve plus que d’occasion.'
            : 'Set no longer sold by the manufacturer; only available second-hand.'}
        </dd>
        <dt>{fr ? 'Prix d’origine' : 'Original price'}</dt>
        <dd>
          {fr
            ? 'Prix de vente conseillé en euros à la sortie du set.'
            : 'Recommended retail price in euros when the set came out.'}
        </dd>
        <dt>Wishlist</dt>
        <dd>
          {fr
            ? 'Liste d’envies : les sets et minifigs que vous aimeriez avoir.'
            : 'The sets and minifigs you would like to have.'}
        </dd>
      </dl>

      <h2 id="qualite">{fr ? 'Qualité et accessibilité' : 'Quality and accessibility'}</h2>
      <p>
        {fr ? 'Le site suit les règles du ' : 'The site follows the '}
        <ExternalLink href="https://checklists.opquast.com/fr/qualite-numerique/">
          {fr ? 'référentiel Opquast « Qualité numérique »' : 'Opquast “Digital quality” checklist'}
        </ExternalLink>
        {fr
          ? ' (version 2025). Si un contenu ou une fonction vous pose problème, écrivez-nous.'
          : ' (2025 version). If any content or feature causes you trouble, let us know.'}
      </p>

      <h2 id="contact">{t('pages.contactTitle')}</h2>
      <ContactList contact={contact} />
      <p>{t('pages.contactDelay')}</p>

      <p>
        <Link href="/mentions-legales">{t('footer.legal')}</Link> ·{' '}
        <Link href="/confidentialite">{t('footer.privacy')}</Link> ·{' '}
        <Link href="/conditions-utilisation">{t('footer.terms')}</Link>
      </p>
    </InfoPage>
  )
}

About.layout = [AppLayout]
