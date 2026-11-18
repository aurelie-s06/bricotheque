import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { addTechnicSets, seedCatalogue } from '#tests/helpers/catalogue'

type Card = { setNum: string }
const setNums = (props: Record<string, any>) => (props.sets as Card[]).map((set) => set.setNum)

test.group('Catalogue: /sets', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedCatalogue())

  test('lists real sets only by default, most recent first', async ({ client, assert }) => {
    const response = await client.get('/sets').withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('sets/index')
    assert.deepEqual(setNums(response.inertiaProps), ['75192-1', '75192-2', '8880-1'])
    assert.equal(response.inertiaProps.pagination.total, 3)
  })

  test('renders the cards in the HTML (server-side rendering)', async ({ client }) => {
    const response = await client.get('/sets')
    response.assertStatus(200)
    response.assertTextIncludes('Catalogue des sets')
    response.assertTextIncludes('href="/sets/75192-1-millennium-falcon"')
    response.assertTextIncludes('loading="lazy"')
  })

  test('type=all includes books, gear and parts packs', async ({ client, assert }) => {
    const response = await client.get('/sets').qs({ type: 'all' }).withInertia()
    assert.equal(response.inertiaProps.pagination.total, 7)

    const books = await client.get('/sets').qs({ type: 'book' }).withInertia()
    assert.deepEqual(setNums(books.inertiaProps), ['0003977811-1'])
  })

  test('spare parts have no list of their own: type=parts shows the sets', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/sets').qs({ type: 'parts' }).withInertia()
    assert.notInclude(setNums(response.inertiaProps), '10003-1')
    assert.notProperty(response.inertiaProps.query, 'type')
  })

  test('searching "75192" finds 75192-1 and its variant', async ({ client, assert }) => {
    const response = await client.get('/sets').qs({ q: '75192' }).withInertia()
    assert.deepEqual(setNums(response.inertiaProps), ['75192-1', '75192-2'])

    const exact = await client.get('/sets').qs({ q: '8880-1' }).withInertia()
    assert.deepEqual(setNums(exact.inertiaProps), ['8880-1'])
  })

  test('searching by name ignores case and needs every word', async ({ client, assert }) => {
    const response = await client.get('/sets').qs({ q: 'MILLENNIUM falcon' }).withInertia()
    assert.deepEqual(setNums(response.inertiaProps), ['75192-1', '75192-2'])

    const none = await client.get('/sets').qs({ q: 'falcon car' }).withInertia()
    assert.lengthOf(none.inertiaProps.sets, 0)
  })

  test('the theme filter includes subthemes', async ({ client, assert }) => {
    const starWars = await client.get('/sets').qs({ theme: 'star-wars' }).withInertia()
    assert.deepEqual(setNums(starWars.inertiaProps), ['75192-1', '75192-2'])
    assert.equal(starWars.inertiaProps.themeName, 'Star Wars')

    const unknown = await client.get('/sets').qs({ theme: 'nope' }).withInertia()
    assert.lengthOf(unknown.inertiaProps.sets, 0)
  })

  test('the subtheme of the filter form wins over the main theme', async ({ client, assert }) => {
    const response = await client
      .get('/sets')
      .qs({ theme: 'star-wars', subtheme: 'ultimate-collector-series' })
      .withInertia()
    assert.equal(response.inertiaProps.themeName, 'Ultimate Collector Series')
    assert.deepEqual(response.inertiaProps.query, { theme: 'ultimate-collector-series' })
  })

  test('filters by year, pieces, status and price', async ({ client, assert }) => {
    const byYear = await client.get('/sets').qs({ year_max: '2000' }).withInertia()
    assert.deepEqual(setNums(byYear.inertiaProps), ['8880-1'])

    const byParts = await client.get('/sets').qs({ parts_min: '5000' }).withInertia()
    assert.deepEqual(setNums(byParts.inertiaProps), ['75192-1', '75192-2'])

    const retired = await client.get('/sets').qs({ status: 'retired' }).withInertia()
    assert.deepEqual(setNums(retired.inertiaProps), ['8880-1'])

    const byPrice = await client
      .get('/sets')
      .qs({ price_min: '100', price_max: '500' })
      .withInertia()
    assert.deepEqual(setNums(byPrice.inertiaProps), ['8880-1'])
  })

  test('sorts by price, name and pieces', async ({ client, assert }) => {
    const byPrice = await client.get('/sets').qs({ sort: 'price_desc' }).withInertia()
    // sets without price come last
    assert.deepEqual(setNums(byPrice.inertiaProps), ['75192-1', '8880-1', '75192-2'])

    const oldest = await client.get('/sets').qs({ sort: 'oldest' }).withInertia()
    assert.equal(setNums(oldest.inertiaProps)[0], '8880-1')

    // "Millennium Falcon, …" sorts before "Millennium Falcon™" (comma before ™)
    const byName = await client.get('/sets').qs({ sort: 'name' }).withInertia()
    assert.deepEqual(setNums(byName.inertiaProps), ['75192-2', '75192-1', '8880-1'])
  })

  test('paginates by 48 and keeps the filters in the links', async ({ client, assert }) => {
    await addTechnicSets(50)

    const first = await client.get('/sets').qs({ theme: 'technic' }).withInertia()
    assert.lengthOf(first.inertiaProps.sets, 48)
    assert.deepInclude(first.inertiaProps.pagination, { total: 51, lastPage: 2, currentPage: 1 })
    assert.deepEqual(first.inertiaProps.query, { theme: 'technic' })

    const second = await client.get('/sets').qs({ theme: 'technic', page: '2' }).withInertia()
    assert.lengthOf(second.inertiaProps.sets, 3)
  })
})

test.group('Catalogue: /sets/:ref', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedCatalogue())

  test('shows a set with its theme, prices and minifigs', async ({ client, assert }) => {
    const response = await client.get('/sets/75192-1-millennium-falcon').withInertia()

    response.assertStatus(200)
    response.assertInertiaComponent('sets/show')
    const { set, themeChain, fallbackDescription } = response.inertiaProps
    assert.deepInclude(set, {
      setNum: '75192-1',
      name: 'Millennium Falcon™',
      rrpEur: 849.99,
      availabilityStatus: 'available',
      dateFirstAvailable: '2017-10-01',
      dateLastAvailable: '2026-12-31',
      bricksetUrl: 'https://brickset.com/sets/75192-1',
      rebrickableUrl: 'https://rebrickable.com/sets/75192-1/',
    })
    assert.deepEqual(
      themeChain.map((theme: { name: string }) => theme.name),
      ['Star Wars', 'Ultimate Collector Series']
    )
    assert.isNull(fallbackDescription)
    assert.deepEqual(
      set.minifigs.map((minifig: { figNum: string; quantity: number }) => [
        minifig.figNum,
        minifig.quantity,
      ]),
      [
        ['fig-000002', 1],
        ['fig-000001', 1],
        ['fig-000003', 2],
      ]
    )
    assert.equal(set.minifigs[0].url, '/minifigs/fig-000002-chewbacca')
  })

  test('the HTML has a title, a description and the breadcrumb', async ({ client }) => {
    const response = await client.get('/sets/75192-1-millennium-falcon')
    response.assertTextIncludes(
      '<title data-inertia="">75192 Millennium Falcon™ – Bricothèque</title>'
    )
    // Only the "-1" of the first version is hidden: the variant keeps its suffix
    const variant = await client.get('/sets/75192-2') // redirects to the canonical URL
    variant.assertTextIncludes('<title data-inertia="">75192-2 ')
    response.assertTextIncludes('name="description"')
    response.assertTextIncludes('Fil d’Ariane')
  })

  test('generates a description when Brickset has none', async ({ client, assert }) => {
    const response = await client.get('/sets/8880-1-super-car').withInertia()
    assert.equal(
      response.inertiaProps.fallbackDescription,
      'Set Technic de 1994 comprenant 1 343 pièces et 2 minifigures.'
    )
  })

  test('partial and outdated URLs redirect to the canonical one', async ({ client }) => {
    for (const path of [
      '/sets/75192-1',
      '/sets/75192-1-old-name',
      '/sets/75192-1-MILLENNIUM-FALCON',
    ]) {
      const response = await client.get(path).redirects(0)
      response.assertStatus(301)
      response.assertHeader('location', '/sets/75192-1-millennium-falcon')
    }
  })

  test('returns 404 for an unknown set', async ({ client }) => {
    const response = await client.get('/sets/00000-1-nothing')
    response.assertStatus(404)
  })
})

test.group('Catalogue: themes and home', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedCatalogue())

  test('/themes lists themes with their number of real sets', async ({ client, assert }) => {
    const response = await client.get('/themes').withInertia()
    response.assertStatus(200)

    const themes = response.inertiaProps.themes as {
      name: string
      count: number
      subthemes: { name: string }[]
    }[]
    const starWars = themes.find((theme) => theme.name === 'Star Wars')!
    assert.equal(starWars.count, 2)
    assert.deepEqual(
      starWars.subthemes.map((subtheme) => subtheme.name),
      ['Ultimate Collector Series']
    )
    // Gear and Books have no real set
    assert.notInclude(
      themes.map((theme) => theme.name),
      'Gear'
    )
  })

  test('/themes/:slug lists the sets of the theme and its subthemes', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/themes/star-wars').withInertia()
    response.assertStatus(200)
    assert.deepEqual(setNums(response.inertiaProps), ['75192-1', '75192-2'])
    assert.equal(response.inertiaProps.theme.name, 'Star Wars')

    const books = await client.get('/themes/books').withInertia()
    assert.deepEqual(setNums(books.inertiaProps), ['0003977811-1'])
  })

  test('/themes/:slug returns 404 for an unknown theme', async ({ client }) => {
    const response = await client.get('/themes/nope')
    response.assertStatus(404)
  })

  test('announced sets: status filter, nearest release first, home section', async ({
    client,
    assert,
  }) => {
    const next = DateTime.utc().plus({ days: 10 }).toISODate()!
    const later = DateTime.utc().plus({ days: 40 }).toISODate()!
    await db.from('sets').where('set_num', '8880-1').update({
      availability_status: 'upcoming',
      date_first_available: later,
    })
    await db.from('sets').where('set_num', '75192-2').update({
      availability_status: 'upcoming',
      date_first_available: next,
    })

    const list = await client.get('/sets').qs({ status: 'upcoming', sort: 'release' }).withInertia()
    assert.deepEqual(setNums(list.inertiaProps), ['75192-2', '8880-1'])

    const home = await client.get('/').withInertia()
    assert.deepEqual(setNums({ sets: home.inertiaProps.announcements }), ['75192-2', '8880-1'])
    assert.equal(home.inertiaProps.announcements[0].releaseDate, next)
    assert.notInclude(setNums({ sets: home.inertiaProps.latestSets }), '8880-1')
  })

  test('the home page shows the latest released sets', async ({ client, assert }) => {
    const response = await client.get('/').withInertia()
    response.assertStatus(200)
    assert.notProperty(response.inertiaProps, 'popularThemes')
    assert.deepEqual(setNums({ sets: response.inertiaProps.latestSets }), ['75192-1'])
  })
})
