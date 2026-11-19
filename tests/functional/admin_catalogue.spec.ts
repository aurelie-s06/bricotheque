import { test } from '@japa/runner'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import BrickSet from '#models/brick_set'
import Minifig from '#models/minifig'
import RebrickableImporter from '#services/rebrickable/rebrickable_importer'
import BricksetImporter from '#services/brickset/brickset_importer'
import { gzippedFixtures } from '#tests/helpers/rebrickable'
import { FakeBricksetApi, bricksetFixtures } from '#tests/helpers/brickset'
import { createUser, firstError, formErrors, resetRateLimits } from '#tests/helpers/auth'

const today = DateTime.fromISO('2026-11-16', { zone: 'utc' })

const createAdmin = async () => {
  const admin = await createUser({ email: 'admin@example.com', username: 'admin' })
  admin.isAdmin = true
  await admin.save()
  return admin
}

/** Rebrickable import of the test dumps (sets and minifigs) */
async function importRebrickable() {
  const directory = await gzippedFixtures('initial')
  const importer = new RebrickableImporter()
  await importer.importThemes(join(directory, 'themes.csv.gz'))
  await importer.importSets(join(directory, 'sets.csv.gz'))
  await importer.importMinifigs(join(directory, 'minifigs.csv.gz'))
}

function importBrickset() {
  return new BricksetImporter(new FakeBricksetApi(bricksetFixtures()), {
    cacheDirectory: join(tmpdir(), `brickset-cache-${randomUUID()}`),
    delayMs: 0,
    today,
  }).importAll()
}

/** The form as the edit page sends it, with some changes */
function setForm(set: BrickSet, changes: Record<string, string> = {}) {
  return {
    name: set.name,
    year: String(set.year ?? ''),
    numParts: String(set.numParts),
    subtheme: set.subtheme ?? '',
    description: set.description ?? '',
    rrpEur: set.rrpEur === null ? '' : String(set.rrpEur),
    rrpUsd: set.rrpUsd === null ? '' : String(set.rrpUsd),
    rrpGbp: set.rrpGbp === null ? '' : String(set.rrpGbp),
    dateFirstAvailable: set.dateFirstAvailable?.toISODate() ?? '',
    dateLastAvailable: set.dateLastAvailable?.toISODate() ?? '',
    availabilityStatus: 'auto',
    ...changes,
  }
}

test.group('Back office: catalogue corrections', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())

  test('only the changed fields are locked, and the imports keep them', async ({
    client,
    assert,
  }) => {
    await importRebrickable()
    await importBrickset()
    const admin = await createAdmin()
    const falcon = await BrickSet.findByOrFail('set_num', '75192-1')
    const originalName = falcon.name

    const edit = await client.get(`/admin/catalogue/sets/${falcon.id}`).loginAs(admin).withInertia()
    edit.assertInertiaComponent('admin/catalogue_edit')
    assert.deepEqual(edit.inertiaProps.item.locked, [])

    await client
      .put(`/admin/catalogue/sets/${falcon.id}`)
      .form(setForm(falcon, { name: 'Faucon Millenium', rrpEur: '799.5' }))
      .loginAs(admin)
      .withCsrfToken()
    await falcon.refresh()
    assert.equal(falcon.name, 'Faucon Millenium')
    assert.strictEqual(falcon.rrpEur, 799.5)
    assert.equal(falcon.lockedFields, 'name,rrp_eur')

    // A status chosen by hand is locked too
    await client
      .put(`/admin/catalogue/sets/${falcon.id}`)
      .form(setForm(falcon, { availabilityStatus: 'retired' }))
      .loginAs(admin)
      .withCsrfToken()
    await falcon.refresh()
    assert.equal(falcon.availabilityStatus, 'retired')
    assert.equal(falcon.lockedFields, 'availability_status,name,rrp_eur')

    // The next imports change nothing that was fixed by hand
    await importRebrickable()
    await importBrickset()
    await falcon.refresh()
    assert.equal(falcon.name, 'Faucon Millenium')
    assert.strictEqual(falcon.rrpEur, 799.5)
    assert.strictEqual(falcon.rrpUsd, 849.99)
    assert.equal(falcon.availabilityStatus, 'retired')

    // Released fields follow the imports again
    await client
      .post(`/admin/catalogue/sets/${falcon.id}/liberer`)
      .form({ fields: ['name', 'availabilityStatus'] })
      .loginAs(admin)
      .withCsrfToken()
    await falcon.refresh()
    assert.equal(falcon.lockedFields, 'rrp_eur')
    await importRebrickable()
    await importBrickset()
    await falcon.refresh()
    assert.equal(falcon.name, originalName)
    assert.equal(falcon.availabilityStatus, 'available')
    assert.strictEqual(falcon.rrpEur, 799.5)

    const list = await client.get('/admin/catalogue').loginAs(admin).withInertia()
    assert.equal(list.inertiaProps.items[0].number, '75192-1')
  })

  test('a minifig name fixed by hand survives the Rebrickable import', async ({
    client,
    assert,
  }) => {
    await importRebrickable()
    const admin = await createAdmin()
    const minifig = await Minifig.query().orderBy('id').firstOrFail()

    await client
      .put(`/admin/catalogue/minifigs/${minifig.id}`)
      .form({ name: 'Nom corrigé', numParts: String(minifig.numParts) })
      .loginAs(admin)
      .withCsrfToken()
    await importRebrickable()
    await minifig.refresh()
    assert.equal(minifig.name, 'Nom corrigé')
    assert.equal(minifig.lockedFields, 'name')
  })

  test('rejects invalid values and is reserved to administrators', async ({ client, assert }) => {
    await importRebrickable()
    const set = await BrickSet.findByOrFail('set_num', '75192-1')

    const invalid = await client
      .put(`/admin/catalogue/sets/${set.id}`)
      .form(setForm(set, { name: '', rrpEur: '-3' }))
      .loginAs(await createAdmin())
      .withCsrfToken()
      .redirects(0)
    const errors = formErrors(invalid)
    assert.exists(firstError(errors.name))
    assert.exists(firstError(errors.rrpEur))

    const member = await client.get(`/admin/catalogue/sets/${set.id}`).loginAs(await createUser())
    member.assertStatus(404)
  })
})
