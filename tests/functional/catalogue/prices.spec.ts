import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import BrickSet from '#models/brick_set'
import UserSet from '#models/user_set'
import { seedCatalogue } from '#tests/helpers/catalogue'
import { createUser, resetRateLimits } from '#tests/helpers/auth'

const setNums = (sets: { setNum: string }[]) => sets.map((set) => set.setNum)

test.group('Prices in the currency of the language', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(async () => {
    await seedCatalogue()
    // 75192-1: 849.99 € / $849.99; 8880-1: 199.99 € / $150
    await db.from('sets').where('set_num', '8880-1').update({ rrp_usd: 150 })
  })

  test('the cards carry both prices, the page shows the one of the language', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/sets?q=8880').withInertia()
    assert.deepInclude(response.inertiaProps.sets[0], { rrpEur: 199.99, rrpUsd: 150 })
  })

  test('the price filter and sort use euros in French, dollars in English', async ({
    client,
    assert,
  }) => {
    // Under 180: 8880-1 is too expensive in euros (199.99 €), cheap enough in dollars ($150)
    const french = await client.get('/sets?price_max=180&type=all').withInertia()
    assert.notInclude(setNums(french.inertiaProps.sets), '8880-1')

    const english = await client
      .get('/sets?price_max=180&type=all')
      .withPlainCookie('locale', 'en')
      .withInertia()
    assert.include(setNums(english.inertiaProps.sets), '8880-1')

    const sorted = await client
      .get('/sets?sort=price_asc&type=all&price_min=1')
      .withPlainCookie('locale', 'en')
      .withInertia()
    assert.deepEqual(setNums(sorted.inertiaProps.sets).slice(0, 2), ['8880-1', '75192-1'])
  })

  test('the wishlist total is in euros in French, in dollars in English', async ({
    client,
    assert,
  }) => {
    const user = await createUser()
    for (const setNum of ['75192-1', '8880-1']) {
      const set = await BrickSet.findByOrFail('set_num', setNum)
      await UserSet.create({ userId: user.id, setId: set.id, status: 'wanted' })
    }

    const french = await client.get('/ma-wishlist').loginAs(user).withInertia()
    assert.deepInclude(french.inertiaProps.wishlistTotal, { currency: 'EUR', total: 1049.98 })

    const english = await client
      .get('/ma-wishlist')
      .withPlainCookie('locale', 'en')
      .loginAs(user)
      .withInertia()
    assert.deepInclude(english.inertiaProps.wishlistTotal, { currency: 'USD', total: 999.99 })
  })
})
