import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Layout', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('home page renders with French layout and legal notice', async ({ client }) => {
    const response = await client.get('/')

    response.assertStatus(200)
    response.assertTextIncludes('<html lang="fr">')
    response.assertTextIncludes('href="#contenu"')
    response.assertTextIncludes('id="contenu"')
    response.assertTextIncludes('Bricothèque')
    response.assertTextIncludes(
      'LEGO® est une marque du groupe LEGO, qui ne parraine ni n’approuve ce site.'
    )
    response.assertTextIncludes('Données : Rebrickable, Brickset.')
  })

  test('guest sees the login button, signup is offered on the login page', async ({ client }) => {
    const home = await client.get('/')
    home.assertTextIncludes('href="/connexion"')

    const login = await client.get('/connexion')
    login.assertTextIncludes('href="/inscription"')
  })

  test('members see their account menu instead of the login button', async ({ client }) => {
    const user = await User.create({
      email: 'member@example.com',
      username: 'member',
      password: 'correct horse battery',
    })
    const response = await client.get('/').loginAs(user)
    response.assertTextIncludes('account-menu')
    response.assertTextIncludes('href="/mon-compte"')
  })

  test('the search leads to the catalogue results', async ({ client }) => {
    const response = await client.get('/recherche').qs({ q: '75192' })

    response.assertStatus(200)
    response.assertTextIncludes('Recherche « 75192 »')
  })

  test('static assets are served', async ({ client }) => {
    for (const path of [
      '/favicon.svg',
      '/favicon-32x32.png',
      '/apple-touch-icon.png',
      '/site.webmanifest',
    ]) {
      const response = await client.get(path)
      response.assertStatus(200)
    }
  })
})
