import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import BrickSet from '#models/brick_set'
import Minifig from '#models/minifig'
import UserMinifig from '#models/user_minifig'
import type User from '#models/user'
import { seedCatalogue } from '#tests/helpers/catalogue'
import { createUser, resetRateLimits } from '#tests/helpers/auth'

/** 75192-1 contains fig-000001, fig-000002 and fig-000003 (× 2) */
const addFalcon = async (client: any, user: User) => {
  const falcon = await BrickSet.findByOrFail('set_num', '75192-1')
  await client
    .post(`/collection/sets/${falcon.id}/owned`)
    .loginAs(user)
    .form({ action: 'add' })
    .withCsrfToken()
}

const ownedMinifigs = async (user: User) => {
  const entries = await UserMinifig.query()
    .where('user_id', user.id)
    .where('status', 'owned')
    .preload('minifig')
  return entries.map((entry) => [entry.minifig.figNum, entry.quantity]).sort()
}

test.group('Collection: minifigs of the sets already owned', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(() => seedCatalogue())

  test('the question shows after the first set, "yes" adds the minifigs', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    const before = await client.get('/').loginAs(user).withInertia()
    assert.isNull(before.inertiaProps.minifigPrompt)

    await addFalcon(client, user)
    const after = await client.get('/').loginAs(user).withInertia()
    assert.deepEqual(after.inertiaProps.minifigPrompt, { missing: 3 })

    await client
      .post('/mon-compte/minifigs/proposition')
      .form({ answer: 'yes' })
      .loginAs(user)
      .withCsrfToken()
    await user.refresh()
    assert.isTrue(user.autoAddMinifigs)
    assert.isTrue(user.minifigPromptAnswered)
    assert.deepEqual(await ownedMinifigs(user), [
      ['fig-000001', 1],
      ['fig-000002', 1],
      ['fig-000003', 2],
    ])

    const answered = await client.get('/').loginAs(user).withInertia()
    assert.isNull(answered.inertiaProps.minifigPrompt)
  })

  test('"no" only hides the question', async ({ client, assert }) => {
    const user = await createUser()
    await addFalcon(client, user)
    await client
      .post('/mon-compte/minifigs/proposition')
      .form({ answer: 'no' })
      .loginAs(user)
      .withCsrfToken()
    await user.refresh()
    assert.isFalse(user.autoAddMinifigs)
    assert.isTrue(user.minifigPromptAnswered)
    assert.lengthOf(await ownedMinifigs(user), 0)
    const page = await client.get('/').loginAs(user).withInertia()
    assert.isNull(page.inertiaProps.minifigPrompt)
  })

  test('the account page adds the missing minifigs, keeping those already there', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    await addFalcon(client, user)
    const first = await Minifig.findByOrFail('fig_num', 'fig-000001')
    await UserMinifig.create({ userId: user.id, minifigId: first.id, status: 'owned', quantity: 5 })

    const account = await client.get('/mon-compte').loginAs(user).withInertia()
    assert.equal(account.inertiaProps.missingMinifigs, 2)

    await client.post('/mon-compte/minifigs').loginAs(user).withCsrfToken()
    assert.deepEqual(await ownedMinifigs(user), [
      ['fig-000001', 5],
      ['fig-000002', 1],
      ['fig-000003', 2],
    ])

    const again = await client
      .post('/mon-compte/minifigs')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
    again.assertFlashMessage(
      'info',
      'Les minifigs de tes sets sont déjà toutes dans ta collection.'
    )
  })
})
