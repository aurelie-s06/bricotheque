/**
 * Basic accessibility check of the typical pages with axe-core (Opquast
 * step 12). Run it against a running server:
 *
 *   npm run test:a11y                      # http://localhost:3333
 *   A11Y_BASE_URL=https://… npm run test:a11y
 *
 * The member pages are checked too when A11Y_EMAIL and A11Y_PASSWORD give
 * an activated account (and the back office with A11Y_ADMIN=1). Exits with an error on "serious" or "critical"
 * violations.
 */
import { chromium, type Page } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'

const BASE_URL = (process.env.A11Y_BASE_URL ?? 'http://localhost:3333').replace(/\/$/, '')
const EMAIL = process.env.A11Y_EMAIL
const PASSWORD = process.env.A11Y_PASSWORD

/** First set / minifig / theme of a list page, to test a detail page */
async function firstLink(page: Page, listPath: string, selector: string) {
  await page.goto(BASE_URL + listPath)
  const href = await page.locator(selector).first().getAttribute('href')
  return href ?? listPath
}

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ locale: 'fr-FR' })
  const page = await context.newPage()

  const publicPages = [
    '/',
    '/sets',
    await firstLink(page, '/sets', '.set-card__link'),
    '/minifigs',
    await firstLink(page, '/minifigs', '.set-card__link'),
    '/themes',
    await firstLink(page, '/themes', 'main a[href^="/themes/"]'),
    '/recherche?q=falcon',
    '/inscription',
    '/connexion',
    '/mot-de-passe-oublie',
    '/a-propos',
    '/mentions-legales',
    '/confidentialite',
    '/conditions-utilisation',
    '/plan-du-site',
    '/cette-page-nexiste-pas',
  ]
  const memberPages = ['/mon-compte', '/ma-collection', '/ma-wishlist', '/tableau-de-bord']
  // Back office: checked when the account is an administrator (A11Y_ADMIN=1)
  if (process.env.A11Y_ADMIN) {
    memberPages.push(
      '/admin',
      '/admin/images',
      '/admin/traductions',
      '/admin/mises-a-jour',
      '/admin/utilisateurs'
    )
  }

  let failures = 0
  async function check(path: string) {
    await page.goto(BASE_URL + path, { waitUntil: 'networkidle' })
    // In development, errors show the debugging page instead of the site's page
    if (await page.locator('.stack-frame-module').count()) {
      console.log(`- ${path} — skipped (development error page)`)
      return
    }
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    const blocking = results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? '')
    )
    const status = blocking.length ? '✖' : '✔'
    console.log(`${status} ${path} — ${results.violations.length} violation(s)`)
    for (const violation of results.violations) {
      console.log(`   [${violation.impact}] ${violation.id}: ${violation.help}`)
      for (const node of violation.nodes.slice(0, 3)) {
        console.log(`      ${node.target.join(' ')}`)
      }
    }
    failures += blocking.length
  }

  for (const path of publicPages) await check(path)

  if (EMAIL && PASSWORD) {
    await page.goto(`${BASE_URL}/connexion`)
    await page.fill('#email', EMAIL)
    await page.fill('#password', PASSWORD)
    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith('/connexion')),
      page.click('form.auth-form button[type="submit"]'),
    ])
    for (const path of memberPages) await check(path)
  } else {
    console.log('(member pages skipped: set A11Y_EMAIL and A11Y_PASSWORD to check them)')
  }

  await browser.close()
  if (failures > 0) {
    console.error(`\n${failures} serious or critical violation(s).`)
    process.exit(1)
  }
  console.log('\nNo serious or critical violation.')
}

await main()
