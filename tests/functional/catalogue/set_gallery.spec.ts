import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import { addTechnicSets, seedCatalogue } from '#tests/helpers/catalogue'
import { FakeBricksetApi } from '#tests/helpers/brickset'
import SetGallery, { DEFAULT_DAILY_LIMIT, NIGHTLY_SHARE } from '#services/brickset/set_gallery'
import BricksetImporter from '#services/brickset/brickset_importer'

const FALCON_PAGE = '/sets/75192-1-millennium-falcon'
const FALCON_BRICKSET_ID = 26725

function falconImages() {
  return [
    {
      imageURL: 'http://images.brickset.com/sets/AdditionalImages/75192-1/75192_alt1.jpg',
      thumbnailURL: 'https://images.brickset.com/sets/AdditionalImages/75192-1/tn_75192_alt1.jpg',
    },
    { imageURL: 'https://images.brickset.com/sets/AdditionalImages/75192-1/75192_alt2.jpg' },
    // duplicate and invalid entries are ignored
    { imageURL: 'https://images.brickset.com/sets/AdditionalImages/75192-1/75192_alt2.jpg' },
    { imageURL: 'javascript:alert(1)' },
    {},
  ]
}

test.group('Set pictures from Brickset', (group) => {
  let api: FakeBricksetApi

  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedCatalogue())
  group.each.setup(() => {
    api = new FakeBricksetApi([])
    api.images.set(FALCON_BRICKSET_ID, falconImages())
    SetGallery.apiFactory = () => api
    SetGallery.resetPause()
  })
  group.each.teardown(() => {
    SetGallery.apiFactory = undefined
    SetGallery.resetPause()
  })

  test('the first visit fetches the pictures, the next ones read them from the database', async ({
    client,
    assert,
  }) => {
    await db.from('sets').where('set_num', '75192-1').update({ additional_image_count: 2 })

    const first = await client.get(FALCON_PAGE).withInertia()
    first.assertStatus(200)
    assert.deepEqual(first.inertiaProps.gallery, [
      {
        url: 'https://images.brickset.com/sets/AdditionalImages/75192-1/75192_alt1.jpg',
        thumbnailUrl: 'https://images.brickset.com/sets/AdditionalImages/75192-1/tn_75192_alt1.jpg',
      },
      {
        url: 'https://images.brickset.com/sets/AdditionalImages/75192-1/75192_alt2.jpg',
        thumbnailUrl: null,
      },
    ])

    const second = await client.get(FALCON_PAGE).withInertia()
    assert.lengthOf(second.inertiaProps.gallery, 2)
    assert.deepEqual(api.imageCalls, [FALCON_BRICKSET_ID])
  })

  test('the page shows the thumbnails and the credit', async ({ client }) => {
    await db.from('sets').where('set_num', '75192-1').update({ additional_image_count: 2 })
    const response = await client.get(FALCON_PAGE)
    response.assertTextIncludes('Afficher la photo 2 sur 3')
    response.assertTextIncludes('Photos supplémentaires : Brickset')
  })

  test('no call for a set without additional pictures or unknown to Brickset', async ({
    client,
    assert,
  }) => {
    await db.from('sets').where('set_num', '75192-1').update({ additional_image_count: 0 })
    const falcon = await client.get(FALCON_PAGE).withInertia()
    assert.deepEqual(falcon.inertiaProps.gallery, [])

    await db.from('sets').where('set_num', '8880-1').update({ additional_image_count: 3 })
    await client.get('/sets/8880-1')
    assert.deepEqual(api.imageCalls, [])
  })

  test('stops at the daily budget', async ({ client, assert }) => {
    await db.from('sets').where('set_num', '75192-1').update({ additional_image_count: 2 })
    // other sets already fetched today use up the budget
    await addTechnicSets(DEFAULT_DAILY_LIMIT)
    const others = await db.from('sets').whereNot('set_num', '75192-1').limit(DEFAULT_DAILY_LIMIT)
    assert.lengthOf(others, DEFAULT_DAILY_LIMIT)
    await db
      .from('sets')
      .whereIn(
        'id',
        others.map((set) => set.id)
      )
      .update({ additional_images_fetched_at: DateTime.utc().toSQL({ includeOffset: false }) })

    const response = await client.get(FALCON_PAGE).withInertia()
    assert.deepEqual(response.inertiaProps.gallery, [])
    assert.deepEqual(api.imageCalls, [])
  })

  test('a Brickset error leaves the page working and pauses the calls', async ({
    client,
    assert,
  }) => {
    await db.from('sets').where('set_num', '75192-1').update({ additional_image_count: 2 })
    api.imagesError = new Error('API limit exceeded')

    const response = await client.get(FALCON_PAGE).withInertia()
    response.assertStatus(200)
    assert.deepEqual(response.inertiaProps.gallery, [])

    api.imagesError = null
    await client.get(FALCON_PAGE)
    assert.deepEqual(api.imageCalls, [FALCON_BRICKSET_ID])
  })

  test('pictures older than the refresh delay are fetched again', async ({ client, assert }) => {
    const old = DateTime.utc().minus({ days: 100 }).toSQL({ includeOffset: false })
    await db
      .from('sets')
      .where('set_num', '75192-1')
      .update({ additional_image_count: 2, additional_images_fetched_at: old })

    const response = await client.get(FALCON_PAGE).withInertia()
    assert.lengthOf(response.inertiaProps.gallery, 2)
    assert.deepEqual(api.imageCalls, [FALCON_BRICKSET_ID])
  })

  test('the nightly batch uses half of the budget', async ({ assert }) => {
    await db.from('sets').where('set_num', '75192-1').update({ additional_image_count: 2 })
    const fetched = await SetGallery.prefetch()
    assert.equal(fetched, 1)
    assert.isAtMost(fetched, Math.floor(DEFAULT_DAILY_LIMIT * NIGHTLY_SHARE))
    assert.lengthOf(await SetGallery.imagesOf((await falconId())!), 2)
  })

  test('the Brickset import keeps the reserve of the pictures', async ({ assert }) => {
    const importer = new BricksetImporter(new FakeBricksetApi([], 78), {
      dailyLimit: 100,
      reserve: DEFAULT_DAILY_LIMIT,
      cacheDirectory: '/nonexistent',
      cacheHours: 0,
      delayMs: 0,
    })
    const outcome = await importer.importAll()
    assert.isFalse(outcome.finished)
    assert.equal(outcome.stats.apiCalls, 0)
  })
})

async function falconId(): Promise<number | undefined> {
  const row = await db.from('sets').where('set_num', '75192-1').select('id').first()
  return row?.id
}
