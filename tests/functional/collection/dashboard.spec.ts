import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import BrickSet from '#models/brick_set'
import Minifig from '#models/minifig'
import UserSet from '#models/user_set'
import UserMinifig from '#models/user_minifig'
import { seedCatalogue } from '#tests/helpers/catalogue'
import { createUser, resetRateLimits } from '#tests/helpers/auth'

const setId = async (setNum: string) => {
  const set = await BrickSet.findByOrFail('set_num', setNum)
  return set.id
}
const setNums = (sets: { setNum: string }[]) => sets.map((set) => set.setNum)

/**
 * Fixture: 75192-1 (Star Wars, 2017, 7541 pieces, 849.99 €),
 * 75192-2 (Star Wars, 2017, 7541 pieces, no price), 8880-1 (Technic, 1994,
 * 1343 pieces, 199.99 €), 0003977811-1 (Books, 2022, 1 piece)
 */
test.group('Dashboard', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(() => seedCatalogue())

  test('is private', async ({ client }) => {
    const response = await client.get('/tableau-de-bord').redirects(0)
    response.assertHeader('location', '/connexion')
  })

  test('is empty without collection', async ({ client, assert }) => {
    const user = await createUser()
    const response = await client.get('/tableau-de-bord').loginAs(user).withInertia()
    response.assertStatus(200)
    assert.deepInclude(response.inertiaProps.figures, { sets: 0, minifigs: 0, pieces: 0, paid: 0 })
    assert.deepEqual(response.inertiaProps.byTheme, [])
  })

  test('computes the key figures', async ({ client, assert }) => {
    const user = await createUser()
    await UserSet.create({
      userId: user.id,
      setId: await setId('75192-1'),
      status: 'owned',
      purchasePrice: 700,
    })
    await UserSet.create({
      userId: user.id,
      setId: await setId('8880-1'),
      status: 'owned',
      quantity: 2,
    })
    await UserSet.create({
      userId: user.id,
      setId: await setId('75192-2'),
      status: 'owned',
      purchasePrice: 10,
      quantity: 3,
    })
    await UserSet.create({ userId: user.id, setId: await setId('0003977811-1'), status: 'wanted' }) // not counted
    const minifig = await Minifig.findByOrFail('fig_num', 'fig-000001')
    await UserMinifig.create({
      userId: user.id,
      minifigId: minifig.id,
      status: 'owned',
      quantity: 2,
    })

    const response = await client.get('/tableau-de-bord').loginAs(user).withInertia()
    assert.deepEqual(response.inertiaProps.figures, {
      sets: 3,
      setCopies: 6,
      minifigs: 1,
      minifigCopies: 2,
      pieces: 7541 + 1343 * 2 + 7541 * 3,
      paid: 700 + 10 * 3, // unit prices × quantities; 8880-1 has no price
      setsWithoutPrice: 1,
      value: 849.99 + 199.99 * 2, // original prices; 75192-2 has none
      valueSources: { bricklink: 0, original: 2, unknown: 1 },
    })
  })

  test('uses the BrickLink value when it is known', async ({ client, assert }) => {
    const user = await createUser()
    const id = await setId('75192-1')
    await db
      .from('sets')
      .where('id', id)
      .update({ estimated_value_new: 1200, estimated_value_used: 900 })
    await UserSet.create({ userId: user.id, setId: id, status: 'owned', condition: 'sealed' })

    const response = await client.get('/tableau-de-bord').loginAs(user).withInertia()
    assert.equal(response.inertiaProps.figures.value, 1200)
    assert.deepEqual(response.inertiaProps.figures.valueSources, {
      bricklink: 1,
      original: 0,
      unknown: 0,
    })
  })

  test('splits the collection by root theme and by decade', async ({ client, assert }) => {
    const user = await createUser()
    for (const setNum of ['75192-1', '75192-2', '8880-1', '0003977811-1']) {
      await UserSet.create({ userId: user.id, setId: await setId(setNum), status: 'owned' })
    }

    const response = await client.get('/tableau-de-bord').loginAs(user).withInertia()
    assert.deepEqual(response.inertiaProps.byTheme, [
      { name: 'Star Wars', url: '/themes/star-wars', count: 2 }, // UCS counted in Star Wars
      { name: 'Books', url: '/themes/books', count: 1 },
      { name: 'Technic', url: '/themes/technic', count: 1 },
    ])
    assert.deepEqual(response.inertiaProps.byDecade, [
      { decade: 1990, count: 1 },
      { decade: 2000, count: 0 }, // empty decades are shown
      { decade: 2010, count: 2 },
      { decade: 2020, count: 1 },
    ])
  })

  test('lists the 5 biggest and the 5 oldest sets', async ({ client, assert }) => {
    const user = await createUser()
    for (const setNum of ['0003977811-1', '8880-1', '75192-1']) {
      await UserSet.create({ userId: user.id, setId: await setId(setNum), status: 'owned' })
    }
    const response = await client.get('/tableau-de-bord').loginAs(user).withInertia()
    assert.deepEqual(setNums(response.inertiaProps.biggest), ['75192-1', '8880-1', '0003977811-1'])
    assert.deepEqual(setNums(response.inertiaProps.oldest), ['8880-1', '75192-1', '0003977811-1'])
  })

  test('warns about wishlist sets retiring soon or already retired', async ({ client, assert }) => {
    const user = await createUser()
    const today = DateTime.utc()
    // 75192-1: leaves the shops in 2 months → soon
    await db
      .from('sets')
      .where('set_num', '75192-1')
      .update({
        availability_status: 'available',
        date_last_available: today.plus({ months: 2 }).toISODate(),
      })
    // 75192-2: available for another 2 years → not listed
    await db
      .from('sets')
      .where('set_num', '75192-2')
      .update({
        availability_status: 'available',
        date_last_available: today.plus({ years: 2 }).toISODate(),
      })
    // 8880-1: retired
    await db.from('sets').where('set_num', '8880-1').update({ availability_status: 'retired' })
    for (const setNum of ['75192-1', '75192-2', '8880-1']) {
      await UserSet.create({ userId: user.id, setId: await setId(setNum), status: 'wanted' })
    }

    const response = await client.get('/tableau-de-bord').loginAs(user).withInertia()
    assert.deepEqual(setNums(response.inertiaProps.retiringSoon), ['75192-1'])
    assert.deepEqual(setNums(response.inertiaProps.retired), ['8880-1'])
    assert.equal(
      response.inertiaProps.wishlistDates[await setId('75192-1')],
      today.plus({ months: 2 }).toISODate()
    )
  })

  test('only counts the collection of the logged-in user', async ({ client, assert }) => {
    const alice = await createUser({ email: 'alice@example.com', username: 'alice' })
    const bob = await createUser({ email: 'bob@example.com', username: 'bob' })
    await UserSet.create({ userId: alice.id, setId: await setId('75192-1'), status: 'owned' })
    await UserSet.create({ userId: alice.id, setId: await setId('8880-1'), status: 'wanted' })
    await db.from('sets').where('set_num', '8880-1').update({ availability_status: 'retired' })

    const response = await client.get('/tableau-de-bord').loginAs(bob).withInertia()
    assert.equal(response.inertiaProps.figures.sets, 0)
    assert.lengthOf(response.inertiaProps.retired, 0)
  })
})
