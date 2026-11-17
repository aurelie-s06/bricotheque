import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { seedCatalogue } from '#tests/helpers/catalogue'
import { createUser, resetRateLimits } from '#tests/helpers/auth'

const createAdmin = async () => {
  const admin = await createUser({ email: 'admin@example.com', username: 'admin' })
  admin.isAdmin = true
  await admin.save()
  return admin
}

const setWithDescription = () => db.from('sets').whereNotNull('description').firstOrFail()

test.group('Translations typed in the site', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(() => seedCatalogue())

  test('the list shows the sets to translate with their English text', async ({
    client,
    assert,
  }) => {
    const set = await setWithDescription()
    const page = await client
      .get('/admin/traductions')
      .loginAs(await createAdmin())
      .withInertia()
    page.assertInertiaComponent('admin/translations')
    assert.equal(page.inertiaProps.filter, 'todo')
    const item = page.inertiaProps.items.find((row: { id: number }) => row.id === set.id)
    assert.equal(item.description, set.description)
    assert.equal(item.descriptionFr, '')
    assert.isAbove(page.inertiaProps.counts.toTranslate, 0)
  })

  test('saves a translation, shown on the set page; an empty field removes it', async ({
    client,
    assert,
  }) => {
    const admin = await createAdmin()
    const set = await setWithDescription()

    const saved = await client
      .put(`/admin/traductions/${set.id}`)
      .loginAs(admin)
      .form({ descriptionFr: '  Une belle description.  ' })
      .withCsrfToken()
      .redirects(0)
    saved.assertFlashMessage('success', `La traduction de « ${set.name} » est enregistrée.`)
    const row = await db.from('sets').where('id', set.id).first()
    assert.equal(row.description_fr, 'Une belle description.')
    assert.isNotNull(row.description_fr_source_hash)

    const detail = await client.get(`/sets/${set.set_num}`).withInertia()
    assert.equal(detail.inertiaProps.set.descriptionFr, 'Une belle description.')

    const done = await client
      .get('/admin/traductions')
      .qs({ statut: 'done' })
      .loginAs(admin)
      .withInertia()
    assert.deepEqual(
      done.inertiaProps.items.map((item: { id: number }) => item.id),
      [set.id]
    )

    await client
      .put(`/admin/traductions/${set.id}`)
      .loginAs(admin)
      .form({ descriptionFr: '' })
      .withCsrfToken()
    const cleared = await db.from('sets').where('id', set.id).first()
    assert.isNull(cleared.description_fr)
  })

  test('without the role, a translation cannot be saved', async ({ client }) => {
    const set = await setWithDescription()
    const member = await client
      .put(`/admin/traductions/${set.id}`)
      .loginAs(await createUser())
      .form({ descriptionFr: 'x' })
      .withCsrfToken()
    member.assertStatus(404)
  })
})
