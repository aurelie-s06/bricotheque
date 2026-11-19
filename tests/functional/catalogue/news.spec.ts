import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { seedCatalogue } from '#tests/helpers/catalogue'

test.group('News of the month', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedCatalogue())

  test('lists the sets out in a past month, with the recent months', async ({ client, assert }) => {
    // 75192-1 came out on 2017-10-01 (see the catalogue of the tests)
    const response = await client.get('/nouveautes/2017-10').withInertia()
    response.assertStatus(200)
    response.assertInertiaComponent('news/show')
    const props = response.inertiaProps
    assert.deepEqual(
      props.sets.map((set: { setNum: string }) => set.setNum),
      ['75192-1']
    )
    assert.lengthOf(props.recentMonths, 12)
    assert.equal(props.recentMonths[0], props.thisMonth)
  })

  test('only the sets already out, and the form leads to the month', async ({ client, assert }) => {
    const today = DateTime.utc()
    await db
      .from('sets')
      .where('set_num', '8880-1')
      .update({ date_first_available: today.plus({ days: 1 }).toISODate() })
    await db
      .from('sets')
      .where('set_num', '75192-2')
      .update({ date_first_available: today.toISODate() })

    const current = await client.get('/nouveautes').withInertia()
    const numbers = current.inertiaProps.sets.map((set: { setNum: string }) => set.setNum)
    assert.include(numbers, '75192-2')
    assert.notInclude(numbers, '8880-1')

    const form = await client.get('/nouveautes').qs({ annee: '2017', mois: '10' }).redirects(0)
    form.assertHeader('location', '/nouveautes/2017-10')
    const thisMonth = await client.get(`/nouveautes/${today.toFormat('yyyy-LL')}`).redirects(0)
    thisMonth.assertStatus(301)
  })

  test('unknown months are not found, and the page is in the sitemap', async ({
    client,
    assert,
  }) => {
    const nextMonth = DateTime.utc().plus({ months: 1 }).toFormat('yyyy-LL')
    for (const month of ['1900-01', '2026-13', nextMonth]) {
      const response = await client.get(`/nouveautes/${month}`)
      response.assertStatus(404)
    }

    const sitemap = await client.get('/sitemaps/pages.xml')
    assert.include(sitemap.text(), '/nouveautes</loc>')
    const lastMonth = DateTime.utc().startOf('month').minus({ months: 1 }).toFormat('yyyy-LL')
    assert.include(sitemap.text(), `/nouveautes/${lastMonth}</loc>`)
  })
})
