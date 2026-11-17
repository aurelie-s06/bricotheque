import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import Theme from '#models/theme'
import BrickSet from '#models/brick_set'
import Minifig from '#models/minifig'
import User from '#models/user'
import UserSet from '#models/user_set'
import UserMinifig from '#models/user_minifig'
import ImportRun from '#models/import_run'

async function seedCatalogue() {
  const starWars = await Theme.create({ id: 158, name: 'Star Wars', slug: 'star-wars' })
  const ucs = await Theme.create({
    id: 171,
    name: 'Ultimate Collector Series',
    slug: 'star-wars-ultimate-collector-series',
    parentId: starWars.id,
  })

  const falcon = await BrickSet.create({
    setNum: '75192-1',
    number: '75192',
    variant: 1,
    name: 'Millennium Falcon',
    slug: 'millennium-falcon',
    year: 2017,
    themeId: ucs.id,
    numParts: 7541,
    rrpEur: 849.99,
  })

  const han = await Minifig.create({
    figNum: 'fig-000001',
    name: 'Han Solo',
    slug: 'han-solo',
    numParts: 4,
    mainThemeId: starWars.id,
    yearFirst: 2017,
  })

  await falcon.related('minifigs').attach({ [han.id]: { quantity: 2 } })

  return { starWars, ucs, falcon, han }
}

test.group('Models and relations', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('themes are nested and keep the Rebrickable id', async ({ assert }) => {
    const { starWars, ucs } = await seedCatalogue()

    assert.equal(ucs.id, 171)
    await ucs.load('parent')
    assert.equal(ucs.parent.id, starWars.id)

    await starWars.load('children')
    assert.deepEqual(
      starWars.children.map((child) => child.id),
      [171]
    )
  })

  test('a set belongs to a theme and lists its minifigs with quantity', async ({ assert }) => {
    const { falcon, ucs } = await seedCatalogue()

    const set = await BrickSet.query()
      .where('set_num', '75192-1')
      .preload('theme')
      .preload('minifigs')
      .firstOrFail()

    assert.equal(set.id, falcon.id)
    assert.equal(set.theme.id, ucs.id)
    assert.equal(set.availabilityStatus, 'unknown')
    assert.strictEqual(set.rrpEur, 849.99)
    assert.lengthOf(set.minifigs, 1)
    assert.equal(set.minifigs[0].name, 'Han Solo')
    assert.equal(set.minifigs[0].$extras.pivot_quantity, 2)
  })

  test('a minifig lists the sets that contain it', async ({ assert }) => {
    const { han, starWars } = await seedCatalogue()

    await han.load('sets')
    await han.load('mainTheme')
    assert.deepEqual(
      han.sets.map((set) => set.setNum),
      ['75192-1']
    )
    assert.equal(han.sets[0].$extras.pivot_quantity, 2)
    assert.equal(han.mainTheme.id, starWars.id)
  })

  test('collections link users to sets and minifigs', async ({ assert }) => {
    const { falcon, han } = await seedCatalogue()
    const user = await User.create({
      email: 'fan@example.com',
      username: 'fan',
      password: 'secret-password',
    })

    await UserSet.create({
      userId: user.id,
      setId: falcon.id,
      status: 'owned',
      condition: 'sealed',
    })
    await UserSet.create({ userId: user.id, setId: falcon.id, status: 'wanted' })
    await UserMinifig.create({ userId: user.id, minifigId: han.id, status: 'owned', quantity: 2 })

    await user.load('userSets', (query) => query.preload('set').orderBy('status'))
    await user.load('userMinifigs', (query) => query.preload('minifig'))

    assert.deepEqual(
      user.userSets.map((entry) => entry.status),
      ['owned', 'wanted']
    )
    assert.equal(user.userSets[0].set.name, 'Millennium Falcon')
    assert.equal(user.userSets[0].condition, 'sealed')
    assert.equal(user.userMinifigs[0].minifig.figNum, 'fig-000001')
  })

  test('the same set cannot be added twice with the same status', async ({ assert }) => {
    const { falcon } = await seedCatalogue()
    const user = await User.create({
      email: 'a@example.com',
      username: 'a',
      password: 'secret-password',
    })

    await UserSet.create({ userId: user.id, setId: falcon.id, status: 'owned' })
    await assert.rejects(() =>
      UserSet.create({ userId: user.id, setId: falcon.id, status: 'owned' })
    )
  })

  test('deleting a user deletes their collection', async ({ assert }) => {
    const { falcon } = await seedCatalogue()
    const user = await User.create({
      email: 'b@example.com',
      username: 'b',
      password: 'secret-password',
    })
    await UserSet.create({ userId: user.id, setId: falcon.id, status: 'owned' })

    await user.delete()
    assert.lengthOf(await UserSet.query().where('user_id', user.id), 0)
  })

  test('import runs store their cursor and stats as JSON', async ({ assert }) => {
    const run = await ImportRun.create({
      source: 'brickset',
      type: 'sets',
      status: 'running',
      cursor: { themeIndex: 3, year: 2021, page: 2 },
      stats: { created: 0, updated: 12, skipped: 1, errors: 0 },
      startedAt: DateTime.now(),
    })

    const fresh = await ImportRun.findOrFail(run.id)
    assert.deepEqual(fresh.cursor, { themeIndex: 3, year: 2021, page: 2 })
    assert.deepEqual(fresh.stats, { created: 0, updated: 12, skipped: 1, errors: 0 })
  })
})
