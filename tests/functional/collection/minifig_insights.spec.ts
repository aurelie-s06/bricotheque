import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import BrickSet from '#models/brick_set'
import Minifig from '#models/minifig'
import Theme from '#models/theme'
import UserSet from '#models/user_set'
import UserMinifig from '#models/user_minifig'
import { seedCatalogue } from '#tests/helpers/catalogue'
import { createUser, resetRateLimits } from '#tests/helpers/auth'

/**
 * 75192-1 (Star Wars) contains fig-000001, fig-000002 and fig-000003;
 * 8880-1 (Technic) contains one minifig.
 */
async function ownFalconAndSupercar() {
  const user = await createUser()
  for (const setNum of ['75192-1', '8880-1']) {
    const set = await BrickSet.findByOrFail('set_num', setNum)
    await UserSet.create({ userId: user.id, setId: set.id, status: 'owned' })
  }
  const first = await Minifig.findByOrFail('fig_num', 'fig-000001')
  await UserMinifig.create({ userId: user.id, minifigId: first.id, status: 'owned', quantity: 3 })
  return user
}

test.group('Collection: missing and duplicate minifigs', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(() => seedCatalogue())

  test('the dashboard counts the missing minifigs per theme and the duplicates', async ({
    client,
    assert,
  }) => {
    const user = await ownFalconAndSupercar()
    const response = await client.get('/tableau-de-bord').loginAs(user).withInertia()
    const starWars = await Theme.query()
      .where('name', 'Star Wars')
      .whereNull('parent_id')
      .firstOrFail()

    assert.deepEqual(
      response.inertiaProps.missingMinifigs.map((row: { name: string; count: number }) => [
        row.name,
        row.count,
      ]),
      [
        ['Star Wars', 2],
        ['Technic', 1],
      ]
    )
    assert.equal(response.inertiaProps.missingMinifigs[0].slug, starWars.slug)
    assert.deepEqual(response.inertiaProps.doubles, { count: 1, extraCopies: 2 })
    assert.equal(response.inertiaProps.doublesTop[0].figNum, 'fig-000001')
  })

  test('lists and adds the missing minifigs of one theme only', async ({ client, assert }) => {
    const user = await ownFalconAndSupercar()
    const starWars = await Theme.query()
      .where('name', 'Star Wars')
      .whereNull('parent_id')
      .firstOrFail()

    const page = await client
      .get(`/ma-collection/minifigs-manquantes?theme=${starWars.slug}`)
      .loginAs(user)
      .withInertia()
    page.assertInertiaComponent('collection/missing_minifigs')
    assert.equal(page.inertiaProps.pagination.total, 2)
    assert.equal(page.inertiaProps.theme.name, 'Star Wars')

    await client
      .post('/ma-collection/minifigs-manquantes')
      .form({ theme: starWars.slug })
      .loginAs(user)
      .withCsrfToken()
    const all = await client.get('/ma-collection/minifigs-manquantes').loginAs(user).withInertia()
    assert.equal(all.inertiaProps.pagination.total, 1)
    const first = await UserMinifig.query()
      .where('user_id', user.id)
      .whereHas('minifig', (query) => query.where('fig_num', 'fig-000001'))
      .firstOrFail()
    assert.equal(first.quantity, 3)
  })

  test('the collection can show the duplicates only', async ({ client, assert }) => {
    const user = await ownFalconAndSupercar()
    const second = await Minifig.findByOrFail('fig_num', 'fig-000002')
    await UserMinifig.create({ userId: user.id, minifigId: second.id, status: 'owned' })

    const response = await client
      .get('/ma-collection?tab=minifigs&doubles=1')
      .loginAs(user)
      .withInertia()
    assert.deepEqual(
      response.inertiaProps.minifigs.map((minifig: { figNum: string }) => minifig.figNum),
      ['fig-000001']
    )
    assert.equal(response.inertiaProps.query.doubles, '1')
  })
})
