import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { seedCatalogue } from '#tests/helpers/catalogue'

/** Origin of the test server, for same-site Referer headers */
const origin = () => `http://${process.env.HOST}:${process.env.PORT}`

test.group('Catalogue: remembered filters', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedCatalogue())

  test('the last list of sets and minifigs is remembered', async ({ client, assert }) => {
    const sets = await client.get('/sets').qs({ theme: 'star-wars', page: '2' })
    assert.equal(sets.session().catalogue?.sets, '/sets?theme=star-wars&page=2')

    const minifigs = await client.get('/minifigs').qs({ q: 'han' })
    assert.equal(minifigs.session().catalogue?.minifigs, '/minifigs?q=han')
  })

  test('menu and breadcrumb links lead back to the remembered lists', async ({
    client,
    assert,
  }) => {
    const response = await client
      .get('/sets/75192-1-millennium-falcon')
      .withSession({ catalogue: { sets: '/sets?theme=star-wars&year_min=2015' } })
      .withInertia()

    assert.deepEqual(response.inertiaProps.catalogueUrls, {
      sets: '/sets?theme=star-wars&year_min=2015',
      minifigs: '/minifigs',
    })
  })

  test('without a remembered list, or with an unexpected value, links are plain', async ({
    client,
    assert,
  }) => {
    const plain = await client.get('/').withInertia()
    assert.deepEqual(plain.inertiaProps.catalogueUrls, { sets: '/sets', minifigs: '/minifigs' })

    const tampered = await client
      .get('/')
      .withSession({ catalogue: { sets: 'https://evil.example/sets' } })
      .withInertia()
    assert.equal(tampered.inertiaProps.catalogueUrls.sets, '/sets')
  })

  test('a detail page reached from a list links back to it', async ({ client, assert }) => {
    const fromList = await client
      .get('/sets/75192-1-millennium-falcon')
      .header('referer', `${origin()}/sets?theme=star-wars&page=2`)
      .withInertia()
    assert.equal(fromList.inertiaProps.backUrl, '/sets?theme=star-wars&page=2')

    const fromSearch = await client
      .get('/minifigs/fig-000001-han-solo')
      .header('referer', `${origin()}/recherche?q=solo`)
      .withInertia()
    assert.equal(fromSearch.inertiaProps.backUrl, '/recherche?q=solo')
  })

  test('no back link from another page or another website', async ({ client, assert }) => {
    for (const referer of [
      `${origin()}/sets/8880-1-super-car`,
      'https://evil.example/sets?q=x',
      'not a url',
    ]) {
      const response = await client
        .get('/sets/75192-1-millennium-falcon')
        .header('referer', referer)
        .withInertia()
      assert.isNull(response.inertiaProps.backUrl, referer)
    }
  })
})
