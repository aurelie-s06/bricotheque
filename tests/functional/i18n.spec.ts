import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { seedCatalogue } from '#tests/helpers/catalogue'
import { fallbackDescription } from '#services/set_description'

test.group('Languages', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedCatalogue())

  test('French by default', async ({ client, assert }) => {
    const response = await client.get('/sets').withInertia()
    assert.equal(response.inertiaProps.locale, 'fr')

    const html = await client.get('/sets')
    html.assertTextIncludes('<html lang="fr">')
    html.assertTextIncludes('Catalogue des sets')
  })

  test('English when the browser prefers it', async ({ client, assert }) => {
    const response = await client
      .get('/sets')
      .header('Accept-Language', 'en-GB,en;q=0.9')
      .withInertia()
    assert.equal(response.inertiaProps.locale, 'en')
  })

  test('the switcher stores the choice and goes back to the page', async ({ client, assert }) => {
    const response = await client.get('/langue/en').qs({ retour: '/sets?q=75192' }).redirects(0)
    response.assertStatus(302)
    response.assertHeader('location', '/sets?q=75192')
    assert.equal(response.cookie('locale')?.value, 'en')
  })

  test('the switcher ignores unknown languages and external return URLs', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/langue/de').qs({ retour: '//evil.example' }).redirects(0)
    response.assertHeader('location', '/')
    assert.isUndefined(response.cookie('locale'))
  })

  test('the whole page is in English with the cookie', async ({ client }) => {
    const response = await client.get('/sets').withPlainCookie('locale', 'en')
    response.assertTextIncludes('<html lang="en">')
    response.assertTextIncludes('Set catalogue')
    response.assertTextIncludes('Skip to content')
    response.assertTextIncludes('is a trademark of the LEGO Group')
  })

  test('set pages: French translation with the original, or English', async ({
    client,
    assert,
  }) => {
    await db
      .from('sets')
      .where('set_num', '75192-1')
      .update({ description_fr: 'Bienvenue dans le plus grand Millennium Falcon.' })

    const french = await client.get('/sets/75192-1-millennium-falcon')
    french.assertTextIncludes('Bienvenue dans le plus grand Millennium Falcon.')
    french.assertTextIncludes('Voir le texte original en anglais')
    french.assertTextIncludes('lang="en">Welcome to the largest Millennium Falcon.')

    const english = await client
      .get('/sets/75192-1-millennium-falcon')
      .withPlainCookie('locale', 'en')
    english.assertTextIncludes('Welcome to the largest Millennium Falcon.')
    // The translation is in the page data, but not displayed
    assert.notInclude(english.text(), '<p>Bienvenue')
  })

  test('the replacement description follows the language', async ({ client, assert }) => {
    const response = await client
      .get('/sets/8880-1-super-car')
      .withPlainCookie('locale', 'en')
      .withInertia()
    assert.equal(
      response.inertiaProps.fallbackDescription,
      'Technic set from 1994 with 1,343 pieces and 2 minifigures.'
    )
  })
})

test.group('Replacement description', () => {
  test('in English', ({ assert }) => {
    assert.equal(
      fallbackDescription({ themeName: 'City', year: 2020, numParts: 1, numMinifigs: 1 }, 'en'),
      'City set from 2020 with 1 piece and 1 minifigure.'
    )
    assert.equal(
      fallbackDescription({ kind: 'book', year: null, numParts: 0, numMinifigs: 0 }, 'en'),
      'Book.'
    )
  })
})
