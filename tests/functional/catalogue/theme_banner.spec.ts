import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Theme from '#models/theme'
import { seedCatalogue } from '#tests/helpers/catalogue'

test.group('Theme page banner', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedCatalogue())

  test('shows the flagship set, the years and the number of sets', async ({ client, assert }) => {
    const starWars = await Theme.query()
      .where('name', 'Star Wars')
      .whereNull('parent_id')
      .firstOrFail()
    const response = await client.get(`/themes/${starWars.slug}`).withInertia()
    response.assertStatus(200)
    const { theme, featured } = response.inertiaProps

    // 75192-2 has more pieces too, but no picture: 75192-1 is the flagship
    assert.deepInclude(featured, { setNum: '75192-1', numParts: 7541, year: 2017 })
    assert.match(featured.url, /^\/sets\/75192-1-/)
    assert.equal(theme.firstYear, 2017)
    assert.equal(theme.lastYear, 2017)
  })
})
