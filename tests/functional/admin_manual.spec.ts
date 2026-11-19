import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import BrickSet from '#models/brick_set'
import Minifig from '#models/minifig'
import { seedCatalogue } from '#tests/helpers/catalogue'
import { createUser, firstError, formErrors, resetRateLimits } from '#tests/helpers/auth'

const createAdmin = async () => {
  const admin = await createUser({ email: 'admin@example.com', username: 'admin' })
  admin.isAdmin = true
  await admin.save()
  return admin
}

const now = () => new Date()

test.group('Back office: manual additions and merges', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(() => seedCatalogue())

  test('adds a set by hand, refuses a number already in the catalogue', async ({
    client,
    assert,
  }) => {
    const admin = await createAdmin()
    const theme = await db.from('themes').orderBy('id').first()

    const form = {
      number: '99999',
      variant: '1',
      name: 'Secret Base',
      year: '2027',
      theme: theme.slug,
      numParts: '512',
      description: '',
    }
    await client.post('/admin/ajouts/sets').form(form).loginAs(admin).withCsrfToken()
    const set = await BrickSet.findByOrFail('set_num', '99999-1~m')
    assert.isTrue(set.isManual)
    assert.equal(set.themeId, theme.id)

    // The public page works with the manual number
    const page = await client.get(`/sets/99999-1~m-${set.slug}`).withInertia()
    page.assertStatus(200)

    const again = await client
      .post('/admin/ajouts/sets')
      .form(form)
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    assert.exists(firstError(formErrors(again).number))
    const existing = await client
      .post('/admin/ajouts/sets')
      .form({ ...form, number: '75192' })
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    assert.exists(firstError(formErrors(existing).number))
  })

  test('the imported duplicate is listed, then merged with collections and fixes', async ({
    client,
    assert,
  }) => {
    const admin = await createAdmin()
    const fan = await createUser()
    const theme = await db.from('themes').orderBy('id').first()
    await client
      .post('/admin/ajouts/sets')
      .form({
        number: '99999',
        variant: '1',
        name: 'Secret Base',
        theme: theme.slug,
        numParts: '512',
      })
      .loginAs(admin)
      .withCsrfToken()
    const manual = await BrickSet.findByOrFail('set_num', '99999-1~m')
    manual.descriptionFr = 'Une base secrète.'
    manual.imgUrlManual = 'https://example.com/base.jpg'
    manual.rrpEur = 59.99
    manual.lockedFields = 'rrp_eur'
    await manual.save()
    await db.table('user_sets').insert([
      { user_id: fan.id, set_id: manual.id, status: 'owned', quantity: 3, created_at: now() },
      { user_id: fan.id, set_id: manual.id, status: 'wanted', quantity: 1, created_at: now() },
    ])

    // The same set arrives from the import, already owned once by the fan
    const [importedId] = await db.table('sets').insert({
      set_num: '99999-1',
      number: '99999',
      variant: 1,
      name: 'Secret Base',
      slug: 'secret-base',
      year: 2027,
      theme_id: theme.id,
      num_parts: 530,
      kind: 'set',
      created_at: now(),
    })
    await db.table('user_sets').insert({
      user_id: fan.id,
      set_id: importedId,
      status: 'owned',
      quantity: 1,
      created_at: now(),
    })

    const list = await client.get('/admin/ajouts?type=sets').loginAs(admin).withInertia()
    assert.equal(list.inertiaProps.items[0].duplicates[0].id, importedId)

    const unconfirmed = await client
      .post(`/admin/ajouts/sets/${manual.id}/fusion`)
      .form({ targetId: String(importedId) })
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    assert.exists(formErrors(unconfirmed).confirm)
    assert.isNotNull(await BrickSet.find(manual.id))

    await client
      .post(`/admin/ajouts/sets/${manual.id}/fusion`)
      .form({ targetId: String(importedId), confirm: 'on' })
      .loginAs(admin)
      .withCsrfToken()

    assert.isNull(await BrickSet.find(manual.id))
    const imported = await BrickSet.findOrFail(importedId)
    assert.equal(imported.numParts, 530)
    assert.strictEqual(imported.rrpEur, 59.99)
    assert.equal(imported.lockedFields, 'rrp_eur')
    assert.equal(imported.descriptionFr, 'Une base secrète.')
    assert.equal(imported.imgUrlManual, 'https://example.com/base.jpg')

    const rows = await db
      .from('user_sets')
      .where('user_id', fan.id)
      .orderBy('status')
      .select('set_id', 'status', 'quantity')
    assert.deepEqual(
      rows.map((row) => [Number(row.set_id), row.status, Number(row.quantity)]),
      [
        [Number(importedId), 'owned', 3],
        [Number(importedId), 'wanted', 1],
      ]
    )
  })

  test('merges a minifig by the number typed by hand, never into a manual item', async ({
    client,
    assert,
  }) => {
    const admin = await createAdmin()
    await client
      .post('/admin/ajouts/minifigs')
      .form({ name: 'Mystery Pilot', numParts: '4' })
      .loginAs(admin)
      .withCsrfToken()
    const manual = await Minifig.query().where('is_manual', true).firstOrFail()
    assert.match(manual.figNum, /^manual-/)
    const target = await Minifig.query().where('is_manual', false).orderBy('id').firstOrFail()

    const unknown = await client
      .post(`/admin/ajouts/minifigs/${manual.id}/fusion`)
      .form({ target: 'fig-999999', confirm: 'on' })
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    assert.exists(formErrors(unknown)[`target-${manual.id}`])

    await client
      .post(`/admin/ajouts/minifigs/${manual.id}/fusion`)
      .form({ target: target.figNum.toUpperCase(), confirm: 'on' })
      .loginAs(admin)
      .withCsrfToken()
    assert.isNull(await Minifig.find(manual.id))
    assert.isNotNull(await Minifig.find(target.id))
  })
})
