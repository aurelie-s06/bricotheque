import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { seedCatalogue } from '#tests/helpers/catalogue'

test.group('News of the month', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedCatalogue())

  test('lists the sets out in a past month, with links to the other months', async ({
    client,
    assert,
  }) => {
    // 75192-1 came out on 2017-10-01 (see the catalogue of the tests)
    const response = await client.get('/nouveautes/2017-10').withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('news/show')
    const props = response.inertiaProps
    assert.deepEqual(
      props.released.map((set: { setNum: string }) => set.setNum),
      ['75192-1']
    )
    assert.deepEqual(props.upcoming, [])
    assert.equal(props.previous, '2017-09')
    assert.equal(props.next, '2017-11')
    assert.isFalse(props.isCurrent)
  })

  test('shows the sets announced for a coming month', async ({ client, assert }) => {
    const nextMonth = DateTime.utc().startOf('month').plus({ months: 1 })
    await db
      .from('sets')
      .where('set_num', '8880-1')
      .update({
        date_first_available: nextMonth.plus({ days: 14 }).toISODate(),
        availability_status: 'upcoming',
      })

    const response = await client.get(`/nouveautes/${nextMonth.toFormat('yyyy-LL')}`).withInertia()
    assert.deepEqual(
      response.inertiaProps.upcoming.map((set: { setNum: string }) => set.setNum),
      ['8880-1']
    )
    assert.deepEqual(response.inertiaProps.released, [])

    const current = await client.get('/nouveautes').withInertia()
    assert.isTrue(current.inertiaProps.isCurrent)
  })

  test('unknown months are not found, and the page is in the sitemap', async ({
    client,
    assert,
  }) => {
    for (const month of ['1900-01', '2026-13', '2099-01']) {
      const response = await client.get(`/nouveautes/${month}`)
      response.assertStatus(404)
    }

    const sitemap = await client.get('/sitemaps/pages.xml')
    assert.include(sitemap.text(), '/nouveautes</loc>')
    const lastMonth = DateTime.utc().startOf('month').minus({ months: 1 }).toFormat('yyyy-LL')
    assert.include(sitemap.text(), `/nouveautes/${lastMonth}</loc>`)
  })
})
