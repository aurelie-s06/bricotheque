import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import UserSet from '#models/user_set'
import UserMinifig from '#models/user_minifig'
import type User from '#models/user'
import { parseSetNumbers } from '#services/collection'
import { seedCatalogue } from '#tests/helpers/catalogue'
import { createUser, formErrors, resetRateLimits } from '#tests/helpers/auth'

const setsOf = async (user: User, status: 'owned' | 'wanted') => {
  const entries = await UserSet.query()
    .where('user_id', user.id)
    .where('status', status)
    .preload('set')
  return entries.map((entry) => entry.set.setNum).sort()
}

test.group('Collection: quick add by set numbers', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(() => seedCatalogue())

  test('reads numbers separated by commas, spaces and new lines', ({ assert }) => {
    assert.deepEqual(parseSetNumbers(' 75192, 75192-2;8880\n75192 '), [
      { typed: '75192', setNum: '75192-1' },
      { typed: '75192-2', setNum: '75192-2' },
      { typed: '8880', setNum: '8880-1' },
    ])
  })

  test('adds the known sets, reports the others and those already there', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    user.autoAddMinifigs = true
    await user.save()

    const first = await client
      .post('/collection/ajout-rapide')
      .form({ numbers: '75192, 99999\n8880', status: 'owned' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
    assert.deepEqual(first.flashMessages().quickAdd, {
      added: 2,
      alreadyThere: 0,
      minifigs: 4,
      unknown: ['99999'],
      status: 'owned',
    })
    assert.deepEqual(await setsOf(user, 'owned'), ['75192-1', '8880-1'])
    assert.lengthOf(await UserMinifig.query().where('user_id', user.id), 4)

    const again = await client
      .post('/collection/ajout-rapide')
      .form({ numbers: '75192 75192-2', status: 'owned' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
    assert.include(again.flashMessages().quickAdd, { added: 1, alreadyThere: 1 })
  })

  test('adds to the wishlist, and rejects an empty list', async ({ client, assert }) => {
    const user = await createUser()
    await client
      .post('/collection/ajout-rapide')
      .form({ numbers: '8880', status: 'wanted' })
      .loginAs(user)
      .withCsrfToken()
    assert.deepEqual(await setsOf(user, 'wanted'), ['8880-1'])
    assert.deepEqual(await setsOf(user, 'owned'), [])

    const empty = await client
      .post('/collection/ajout-rapide')
      .form({ numbers: '  ', status: 'owned' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)
    assert.exists(formErrors(empty).numbers)
  })
})
