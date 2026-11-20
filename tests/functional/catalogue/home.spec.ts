import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { join } from 'node:path'
import BrickSet from '#models/brick_set'
import RebrickableImporter from '#services/rebrickable/rebrickable_importer'
import { gzippedFixtures } from '#tests/helpers/rebrickable'
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

  test('the latest announcements come first, even when they come out later', async ({
    client,
    assert,
  }) => {
    const nextYear = DateTime.utc().year + 1
    // An announcement known for a while, out soon
    await db
      .from('sets')
      .where('set_num', '75192-2')
      .update({
        availability_status: 'upcoming',
        date_first_available: DateTime.utc().plus({ days: 10 }).toISODate(),
        created_at: '2026-01-01 00:00:00',
      })
    // Announced last night, out next year
    await db
      .from('sets')
      .where('set_num', '8880-1')
      .update({
        availability_status: 'upcoming',
        year: nextYear,
        date_first_available: null,
        created_at: DateTime.utc().toFormat('yyyy-LL-dd HH:mm:ss'),
      })

    const response = await client.get('/').withInertia()
    assert.deepEqual(
      response.inertiaProps.announcements.map((set: { setNum: string }) => set.setNum),
      ['8880-1', '75192-2']
    )
  })

  test('a set of a future year is an announcement as soon as Rebrickable brings it', async ({
    assert,
  }) => {
    const theme = await db.from('themes').orderBy('id').firstOrFail()
    const now = DateTime.utc().toFormat('yyyy-LL-dd HH:mm:ss')
    // A set of next year, no date yet (Brickset has not run), and an old one
    await db.table('sets').insert([
      {
        set_num: '99001-1',
        number: '99001',
        variant: 1,
        name: 'Future Set',
        slug: 'future-set',
        year: DateTime.utc().year + 1,
        theme_id: theme.id,
        kind: 'set',
        num_parts: 500,
        created_at: now,
      },
      {
        set_num: '99002-1',
        number: '99002',
        variant: 1,
        name: 'Old Set',
        slug: 'old-set',
        year: 2001,
        theme_id: theme.id,
        kind: 'set',
        num_parts: 500,
        created_at: now,
      },
    ])

    const directory = await gzippedFixtures('initial')
    await new RebrickableImporter().importSets(join(directory, 'sets.csv.gz'))

    const future = await BrickSet.findByOrFail('set_num', '99001-1')
    const old = await BrickSet.findByOrFail('set_num', '99002-1')
    assert.equal(future.availabilityStatus, 'upcoming')
    assert.equal(old.availabilityStatus, 'unknown')
  })
})
