import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { seedCatalogue } from '#tests/helpers/catalogue'

test.group('Home page showcase', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedCatalogue())

  test('figures, mosaic of the latest sets and big themes of the moment', async ({
    client,
    assert,
  }) => {
    // 75192-1 (Star Wars) is made a recent set
    const year = DateTime.utc().year
    await db
      .from('sets')
      .where('set_num', '75192-1')
      .update({ year, date_first_available: DateTime.utc().minus({ days: 3 }).toISODate() })

    const response = await client.get('/').withInertia()
    const { showcase } = response.inertiaProps
    const [sets] = await db.from('sets').where('kind', 'set').count('* as total')
    assert.equal(showcase.counts.sets, Number(sets.total))
    assert.isAbove(showcase.counts.minifigs, 0)
    assert.include(showcase.mosaic, 'https://cdn.rebrickable.com/media/sets/75192-1.jpg')

    assert.equal(showcase.themes[0].name, 'Star Wars')
    assert.equal(showcase.themes[0].image, 'https://cdn.rebrickable.com/media/sets/75192-1.jpg')
    assert.match(showcase.themes[0].url, /^\/themes\//)
  })
})
