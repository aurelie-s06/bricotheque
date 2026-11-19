import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import mail from '@adonisjs/mail/services/main'
import BrickSet from '#models/brick_set'
import UserSet from '#models/user_set'
import type User from '#models/user'
import WishlistAlerts from '#services/wishlist_alerts'
import { WishlistAlertMail } from '#mails/account_mails'
import { seedCatalogue } from '#tests/helpers/catalogue'
import { createUser, resetRateLimits } from '#tests/helpers/auth'

const today = DateTime.fromISO('2026-11-20', { zone: 'utc' }) as DateTime<true>

/** 8880-1 came out 10 days ago, 75192-1 leaves the shops in 15 days */
async function wishlistWithNews(user: User) {
  await db.from('sets').where('set_num', '8880-1').update({
    availability_status: 'available',
    date_first_available: '2026-11-10',
    date_last_available: null,
  })
  await db.from('sets').where('set_num', '75192-1').update({
    availability_status: 'available',
    date_last_available: '2026-12-05',
  })
  for (const setNum of ['8880-1', '75192-1']) {
    const set = await BrickSet.findByOrFail('set_num', setNum)
    await UserSet.create({ userId: user.id, setId: set.id, status: 'wanted' })
  }
}

test.group('Wishlist alerts by email', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(() => seedCatalogue())
  group.each.teardown(() => mail.restore())

  test('one email per member who asked, each set announced once', async ({ assert }) => {
    const { mails } = mail.fake()
    const fan = await createUser()
    fan.wishlistAlerts = true
    fan.locale = 'en'
    await fan.save()
    await wishlistWithNews(fan)
    const other = await createUser({ email: 'other@example.com', username: 'other' })
    await wishlistWithNews(other)

    assert.equal(await WishlistAlerts.run(today), 1)
    mails.assertSentCount(WishlistAlertMail, 1)
    mails.assertSent(WishlistAlertMail, ({ message }) => {
      const text = message.toJSON().message.text as string
      return (
        message.hasTo('fan@example.com') &&
        text.includes('These sets of your wishlist came out') &&
        text.includes('8880 Super Car') &&
        text.includes('on sale until 5 December 2026') &&
        text.includes('/alertes-wishlist/desinscription/')
      )
    })

    assert.equal(await WishlistAlerts.run(today), 0)
    mails.assertSentCount(WishlistAlertMail, 1)
  })

  test('the link of the email unsubscribes without logging in', async ({ client, assert }) => {
    const fan = await createUser()
    fan.wishlistAlerts = true
    await fan.save()

    const forged = await client.get(`/alertes-wishlist/desinscription/${fan.id}`).redirects(0)
    forged.assertFlashMessage(
      'error',
      'Ce lien de désinscription n’est pas valide. Désactive les alertes dans Mon compte › Préférences.'
    )
    await fan.refresh()
    assert.isTrue(fan.wishlistAlerts)

    const url = new URL(WishlistAlerts.unsubscribeUrl(fan))
    await client.get(url.pathname + url.search)
    await fan.refresh()
    assert.isFalse(fan.wishlistAlerts)
  })

  test('asked once after the first wishlist set, and saved in the preferences', async ({
    client,
    assert,
  }) => {
    const fan = await createUser({ email: 'fan2@example.com', username: 'fan2' })
    fan.minifigPromptAnswered = true
    await fan.save()
    const before = await client.get('/').loginAs(fan).withInertia()
    assert.isFalse(before.inertiaProps.wishlistAlertsPrompt)

    const set = await BrickSet.findByOrFail('set_num', '8880-1')
    await UserSet.create({ userId: fan.id, setId: set.id, status: 'wanted' })
    const after = await client.get('/').loginAs(fan).withInertia()
    assert.isTrue(after.inertiaProps.wishlistAlertsPrompt)

    await client
      .post('/mon-compte/alertes/proposition')
      .form({ answer: 'yes' })
      .loginAs(fan)
      .withCsrfToken()
    await fan.refresh()
    assert.isTrue(fan.wishlistAlerts)
    assert.equal(fan.locale, 'fr')

    await client.put('/mon-compte/preferences').form({}).loginAs(fan).withCsrfToken()
    await fan.refresh()
    assert.isFalse(fan.wishlistAlerts)
    const answered = await client.get('/').loginAs(fan).withInertia()
    assert.isFalse(answered.inertiaProps.wishlistAlertsPrompt)
  })
})
