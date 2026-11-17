import env from '#start/env'

/**
 * Who publishes the site and how to reach them (legal notice, about,
 * emails). Personal details live in .env, not in the code.
 */
export function legalInfo() {
  return {
    publisher: env.get('LEGAL_PUBLISHER') || null,
    contactEmail: env.get('CONTACT_EMAIL') || null,
    issuesUrl: env.get('CONTACT_ISSUES_URL') || null,
    siteUrl: env.get('APP_URL'),
  }
}

/** Host of the production site (o2switch) */
export const HOST_INFO = {
  name: 'o2switch',
  address: 'Chemin des Pardiaux, 63000 Clermont-Ferrand, France',
  phone: '+33 4 44 44 60 40',
  url: 'https://www.o2switch.fr',
}
