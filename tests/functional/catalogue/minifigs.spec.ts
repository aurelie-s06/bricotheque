import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Minifig from '#models/minifig'
import BrickSet from '#models/brick_set'
import { seedCatalogue } from '#tests/helpers/catalogue'

/**
 * Minifigs of tests/fixtures/rebrickable/initial:
 * fig-000001 Han Solo (Star Wars, 1994, in 75192-1, 75192-2 and 8880-1)
 * fig-000002 Chewbacca, fig-000003 Stormtrooper ×2 (Star Wars, 2017, in 75192-1)
 * fig-000006 Book Wizard (Books, 2022), fig-000007 Super Car Driver (Technic, 1994)
 * fig-000004 and fig-000005: in no set
 */
type Card = { figNum: string }
const figNums = (items: Card[]) => items.map((item) => item.figNum)

test.group('Catalogue: /minifigs', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedCatalogue())

  test('lists every minifig, most recent first', async ({ client, assert }) => {
    const response = await client.get('/minifigs').withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('minifigs/index')
    assert.equal(response.inertiaProps.pagination.total, 7)
    assert.equal(figNums(response.inertiaProps.minifigs)[0], 'fig-000006')
    // minifigs without year come last
    assert.sameMembers(figNums(response.inertiaProps.minifigs).slice(-2), [
      'fig-000004',
      'fig-000005',
    ])
  })

  test('searches by name and by number', async ({ client, assert }) => {
    const byName = await client.get('/minifigs').qs({ q: 'han SOLO' }).withInertia()
    assert.deepEqual(figNums(byName.inertiaProps.minifigs), ['fig-000001'])

    for (const q of ['fig-000003', '3', 'FIG000003']) {
      const byNumber = await client.get('/minifigs').qs({ q }).withInertia()
      assert.deepEqual(figNums(byNumber.inertiaProps.minifigs), ['fig-000003'], q)
    }
  })

  test('filters by main theme and year of first appearance', async ({ client, assert }) => {
    const starWars = await client.get('/minifigs').qs({ theme: 'star-wars' }).withInertia()
    assert.sameMembers(figNums(starWars.inertiaProps.minifigs), [
      'fig-000001',
      'fig-000002',
      'fig-000003',
    ])
    assert.equal(starWars.inertiaProps.themeName, 'Star Wars')

    const nineties = await client
      .get('/minifigs')
      .qs({ year_max: '1999', sort: 'name' })
      .withInertia()
    assert.deepEqual(figNums(nineties.inertiaProps.minifigs), ['fig-000001', 'fig-000007'])

    // only the main themes that have minifigs are offered
    const options = starWars.inertiaProps.themeOptions.map((theme: { slug: string }) => theme.slug)
    assert.includeMembers(options, ['star-wars', 'technic', 'books'])
    assert.notInclude(options, 'gear')
  })
})

test.group('Catalogue: /minifigs/:ref', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedCatalogue())

  test('shows a minifig with its theme and the sets that contain it', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/minifigs/fig-000003-stormtrooper-white').withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('minifigs/show')

    const { minifig, themeChain } = response.inertiaProps
    assert.deepInclude(minifig, {
      figNum: 'fig-000003',
      name: 'Stormtrooper, White',
      yearFirst: 2017,
      numParts: 4,
      rebrickableUrl: 'https://rebrickable.com/minifigs/fig-000003/',
    })
    assert.deepEqual(themeChain, [{ name: 'Star Wars', url: '/themes/star-wars' }])
    assert.deepEqual(
      minifig.sets.map((set: { setNum: string; quantity: number; url: string }) => [
        set.setNum,
        set.quantity,
        set.url,
      ]),
      [['75192-1', 2, '/sets/75192-1-millennium-falcon']]
    )
  })

  test('lists the sets of a minifig by year', async ({ client, assert }) => {
    const response = await client.get('/minifigs/fig-000001-han-solo').withInertia()
    assert.deepEqual(
      response.inertiaProps.minifig.sets.map((set: { setNum: string }) => set.setNum),
      ['8880-1', '75192-1', '75192-2']
    )
  })

  test('a minifig in no set has an empty list', async ({ client, assert }) => {
    const response = await client.get('/minifigs/fig-000005-orphan-figure').withInertia()
    response.assertStatus(200)
    assert.lengthOf(response.inertiaProps.minifig.sets, 0)
    assert.deepEqual(response.inertiaProps.themeChain, [])
  })

  test('the set page links to the minifig page', async ({ client, assert }) => {
    const set = await client.get('/sets/75192-1-millennium-falcon').withInertia()
    const url = set.inertiaProps.set.minifigs.find(
      (minifig: { figNum: string }) => minifig.figNum === 'fig-000003'
    ).url
    assert.equal(url, '/minifigs/fig-000003-stormtrooper-white')

    const minifigPage = await client.get(url)
    minifigPage.assertStatus(200)
  })

  test('partial URLs redirect, unknown minifigs return 404', async ({ client }) => {
    const partial = await client.get('/minifigs/fig-000001').redirects(0)
    partial.assertStatus(301)
    partial.assertHeader('location', '/minifigs/fig-000001-han-solo')

    const unknown = await client.get('/minifigs/fig-999999-nobody')
    unknown.assertStatus(404)
  })
})

test.group('Catalogue: relation sets ↔ minifigs', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedCatalogue())

  test('both sides of the relation agree', async ({ assert }) => {
    const set = await BrickSet.query().where('set_num', '75192-1').preload('minifigs').firstOrFail()
    for (const minifig of set.minifigs) {
      const loaded = await Minifig.query().where('id', minifig.id).preload('sets').firstOrFail()
      assert.include(
        loaded.sets.map((other) => other.setNum),
        '75192-1'
      )
    }
  })
})

test.group('Global search', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedCatalogue())

  test('shows sets and minifigs in separate sections', async ({ client, assert }) => {
    const response = await client.get('/recherche').qs({ q: 'falcon' }).withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('search')
    assert.deepInclude(response.inertiaProps, { q: 'falcon', setsTotal: 2, minifigsTotal: 0 })

    const han = await client.get('/recherche').qs({ q: 'solo' }).withInertia()
    assert.deepInclude(han.inertiaProps, { setsTotal: 0, minifigsTotal: 1 })
    assert.deepEqual(figNums(han.inertiaProps.minifigs), ['fig-000001'])
  })

  test('a number finds both a set and a minifig', async ({ client, assert }) => {
    // "8880" is a set number; "1" alone would be fig-000001
    const set = await client.get('/recherche').qs({ q: '8880' }).withInertia()
    assert.equal(set.inertiaProps.setsTotal, 1)

    const minifig = await client.get('/recherche').qs({ q: 'fig-000007' }).withInertia()
    assert.deepEqual(figNums(minifig.inertiaProps.minifigs), ['fig-000007'])
  })

  test('without query, shows the search form', async ({ client, assert }) => {
    const response = await client.get('/recherche').withInertia()
    response.assertStatus(200)
    assert.deepInclude(response.inertiaProps, { q: '', setsTotal: 0, minifigsTotal: 0 })
  })
})
