import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { seedCatalogue } from '#tests/helpers/catalogue'

test.group('Information pages', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('{0} is reachable and linked from the footer of every page')
    .with([
      '/a-propos',
      '/mentions-legales',
      '/confidentialite',
      '/conditions-utilisation',
      '/plan-du-site',
    ])
    .run(async ({ client }, path) => {
      const page = await client.get(path)
      page.assertStatus(200)

      const home = await client.get('/')
      home.assertTextIncludes(`href="${path}"`)
    })

  test('the privacy page lists the cookies', async ({ client }) => {
    const response = await client.get('/confidentialite')
    response.assertTextIncludes('adonis-session')
    response.assertTextIncludes('XSRF-TOKEN')
    response.assertTextIncludes('locale')
  })
})

test.group('Robots and sitemaps', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('robots.txt keeps the private areas out and gives the sitemap', async ({ client }) => {
    const response = await client.get('/robots.txt')
    response.assertStatus(200)
    response.assertHeader('content-type', 'text/plain; charset=utf-8')
    response.assertTextIncludes('Disallow: /ma-collection')
    response.assertTextIncludes('Sitemap: ')
  })

  test('the sitemaps list the public catalogue', async ({ client }) => {
    await seedCatalogue()
    const index = await client.get('/sitemap.xml')
    index.assertStatus(200)
    index.assertTextIncludes('/sitemaps/sets.xml')

    const sets = await client.get('/sitemaps/sets.xml')
    sets.assertTextIncludes('/sets/75192-1-')

    const pages = await client.get('/sitemaps/pages.xml')
    pages.assertTextIncludes('/a-propos</loc>')

    const unknown = await client.get('/sitemaps/secret.xml')
    unknown.assertStatus(404)
  })
})

test.group('Server', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('sends the security headers', async ({ client, assert }) => {
    const response = await client.get('/')
    assert.equal(response.header('referrer-policy'), 'strict-origin-when-cross-origin')
    assert.equal(response.header('x-content-type-options'), 'nosniff')
    assert.equal(response.header('x-frame-options'), 'DENY')
    assert.include(response.header('content-security-policy'), "frame-ancestors 'none'")
    assert.isUndefined(response.header('x-powered-by'))
  })

  test('compresses the pages for the clients that accept it', async ({ client, assert }) => {
    const response = await client.get('/a-propos').header('accept-encoding', 'gzip')
    assert.equal(response.header('content-encoding'), 'gzip')
  })

  test('unknown pages get a 404 code and the custom page with the menu', async ({ client }) => {
    const response = await client.get('/cette-page-nexiste-pas').withInertia()
    response.assertStatus(404)
    response.assertInertiaComponent('errors/not_found')
  })
})
