import { test } from '@japa/runner'

test.group('Layout', () => {
  test('home page renders with French layout and legal notice', async ({ client }) => {
    const response = await client.get('/')

    response.assertStatus(200)
    response.assertTextIncludes('<html lang="fr">')
    response.assertTextIncludes('href="#contenu"')
    response.assertTextIncludes('id="contenu"')
    response.assertTextIncludes('Briquothèque')
    response.assertTextIncludes(
      'LEGO® est une marque du groupe LEGO, qui ne parraine ni n’approuve ce site.'
    )
    response.assertTextIncludes('Données : Rebrickable, Brickset.')
  })

  test('guest sees login and signup links', async ({ client }) => {
    const response = await client.get('/')

    response.assertTextIncludes('href="/connexion"')
    response.assertTextIncludes('href="/inscription"')
  })

  test('the search leads to the catalogue results', async ({ client }) => {
    const response = await client.get('/recherche').qs({ q: '75192' })

    response.assertStatus(200)
    response.assertTextIncludes('Recherche « 75192 » dans les sets')
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
