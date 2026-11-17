import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import ace from '@adonisjs/core/services/ace'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import Job from '#models/job'
import BrickSet from '#models/brick_set'
import SyncJob from '#services/jobs/sync_job'
import ImageUrlCheck from '#services/admin/image_url_check'
import UserMakeAdmin from '#commands/user_make_admin'
import { seedCatalogue } from '#tests/helpers/catalogue'
import { createUser, firstError, formErrors, resetRateLimits } from '#tests/helpers/auth'

/** Date format of the MySQL DATETIME columns (as Lucid writes them) */
const SQL_DATETIME = 'yyyy-LL-dd HH:mm:ss'

const createAdmin = async () => {
  const admin = await createUser({ email: 'admin@example.com', username: 'admin' })
  admin.isAdmin = true
  await admin.save()
  return admin
}

/** Fake network answer for the picture checks */
const answer = (contentType: string, status = 200) =>
  (async () =>
    new Response('', { status, headers: { 'content-type': contentType } })) as typeof fetch

test.group('Back office: access', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())

  test('visitors log in first, members get a 404, administrators get in', async ({ client }) => {
    const guest = await client.get('/admin').redirects(0)
    guest.assertHeader('location', '/connexion')

    const member = await client.get('/admin/mises-a-jour').loginAs(await createUser())
    member.assertStatus(404)

    const admin = await client
      .get('/admin')
      .loginAs(await createAdmin())
      .withInertia()
    admin.assertStatus(200)
    admin.assertInertiaComponent('admin/dashboard')
  })

  test('only administrators see the back office in the shared user', async ({ client, assert }) => {
    const member = await client
      .get('/')
      .loginAs(await createUser())
      .withInertia()
    assert.isFalse(member.inertiaProps.user.isAdmin)
    const admin = await client
      .get('/')
      .loginAs(await createAdmin())
      .withInertia()
    assert.isTrue(admin.inertiaProps.user.isAdmin)
  })

  test('user:make-admin gives and removes the role', async ({ assert }) => {
    const user = await createUser({ email: 'boss@example.com', username: 'boss' })
    const give = await ace.create(UserMakeAdmin, ['Boss@Example.com'])
    await give.exec()
    give.assertSucceeded()
    await user.refresh()
    assert.isTrue(user.isAdmin)

    const remove = await ace.create(UserMakeAdmin, ['boss@example.com', '--remove'])
    await remove.exec()
    await user.refresh()
    assert.isFalse(user.isAdmin)

    const unknown = await ace.create(UserMakeAdmin, ['nobody@example.com'])
    await unknown.exec()
    unknown.assertFailed()
  })
})

test.group('Back office: dashboard, users and pictures', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(() => seedCatalogue())
  group.each.teardown(() => {
    ImageUrlCheck.fetcher = (input, init) => fetch(input, init)
  })

  test('the dashboard and the users list give the figures', async ({ client, assert }) => {
    const admin = await createAdmin()
    const dashboard = await client.get('/admin').loginAs(admin).withInertia()
    const [{ total }] = await db.from('sets').count('* as total')
    assert.equal(dashboard.inertiaProps.figures.sets, Number(total))
    assert.equal(dashboard.inertiaProps.figures.users, 1)
    assert.isAbove(dashboard.inertiaProps.figures.setsWithoutImage, 0)

    const users = await client.get('/admin/utilisateurs').loginAs(admin).withInertia()
    assert.deepInclude(users.inertiaProps.users[0], { username: 'admin', isAdmin: true, sets: 0 })
  })

  test('lists the sets without a picture', async ({ client, assert }) => {
    const response = await client
      .get('/admin/images')
      .loginAs(await createAdmin())
      .withInertia()
    const numbers = response.inertiaProps.items.map((item: { number: string }) => item.number)
    assert.include(numbers, '75192-2')
    assert.notInclude(numbers, '75192-1')
  })

  test('a manual picture is checked, wins over the import and leaves the list', async ({
    client,
    assert,
  }) => {
    const admin = await createAdmin()
    const set = await BrickSet.findByOrFail('set_num', '75192-2')

    const http = await client
      .put(`/admin/images/sets/${set.id}`)
      .loginAs(admin)
      .form({ url: 'http://example.com/a.jpg' })
      .withCsrfToken()
      .redirects(0)
    assert.equal(firstError(formErrors(http).url), 'L’adresse doit commencer par https://.')

    ImageUrlCheck.fetcher = answer('text/html')
    const page = await client
      .put(`/admin/images/sets/${set.id}`)
      .loginAs(admin)
      .form({ url: 'https://example.com/page' })
      .withCsrfToken()
      .redirects(0)
    assert.equal(firstError(formErrors(page).url), 'Cette adresse ne pointe pas vers une image.')

    ImageUrlCheck.fetcher = answer('image/jpeg')
    const ok = await client
      .put(`/admin/images/sets/${set.id}`)
      .loginAs(admin)
      .form({ url: 'https://example.com/falcon.jpg' })
      .withCsrfToken()
      .redirects(0)
    ok.assertFlashMessage(
      'success',
      'L’image de « Millennium Falcon, "UCS" bonus » est enregistrée.'
    )

    const detail = await client.get('/sets/75192-2').withInertia()
    assert.equal(detail.inertiaProps.set.imgUrl, 'https://example.com/falcon.jpg')

    const list = await client.get('/admin/images').loginAs(admin).withInertia()
    assert.notInclude(
      list.inertiaProps.items.map((item: { number: string }) => item.number),
      '75192-2'
    )

    // The importer never touches the manual picture
    await db.from('sets').where('id', set.id).update({ img_url: 'https://cdn.example/new.jpg' })
    await set.refresh()
    assert.equal(set.imgUrlManual, 'https://example.com/falcon.jpg')
  })

  test('a broken picture reported by an administrator appears in the list', async ({
    client,
    assert,
  }) => {
    const admin = await createAdmin()
    const set = await BrickSet.findByOrFail('set_num', '75192-1')
    const member = await client
      .post(`/admin/images/sets/${set.id}/cassee`)
      .loginAs(await createUser())
      .withCsrfToken()
    member.assertStatus(404)

    const report = await client
      .post(`/admin/images/sets/${set.id}/cassee`)
      .loginAs(admin)
      .withCsrfToken()
    report.assertStatus(204)

    const list = await client.get('/admin/images').loginAs(admin).withInertia()
    const broken = list.inertiaProps.items.find(
      (item: { number: string }) => item.number === '75192-1'
    )
    assert.isTrue(broken.broken)
  })
})

test.group('Back office: data updates', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())

  test('the button queues one update at a time', async ({ client, assert }) => {
    const admin = await createAdmin()
    const first = await client
      .post('/admin/mises-a-jour')
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    first.assertFlashMessage(
      'success',
      'Mise à jour demandée : elle démarre dans la minute qui suit (tâche planifiée).'
    )
    const second = await client
      .post('/admin/mises-a-jour')
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    second.assertFlashMessage('error', 'Une mise à jour est déjà en attente ou en cours.')

    const jobs = await Job.all()
    assert.lengthOf(jobs, 1)
    assert.equal(jobs[0].status, 'pending')
    assert.equal(jobs[0].requestedBy, admin.id)

    const page = await client.get('/admin/mises-a-jour').loginAs(admin).withInertia()
    assert.equal(page.inertiaProps.job.status, 'pending')
  })

  test('the worker claims a pending job once; a dead job is released', async ({ assert }) => {
    const job = await SyncJob.enqueue(null)
    const claimed = await SyncJob.claim()
    assert.equal(claimed?.id, job?.id)
    assert.equal(claimed?.status, 'running')
    assert.isNull(await SyncJob.claim())
    assert.isNull(await SyncJob.enqueue(null))

    // No news for a long time: the job is marked as failed, a new one can start
    await Job.query()
      .where('id', job!.id)
      .update({ heartbeatAt: DateTime.now().minus({ hours: 1 }).toFormat(SQL_DATETIME) })
    assert.isNotNull(await SyncJob.enqueue(null))
    await job!.refresh()
    assert.equal(job!.status, 'failed')
  })

  test('without the role, the updates cannot be asked for', async ({ client, assert }) => {
    const member = await User.create({
      email: 'm@example.com',
      username: 'member',
      password: 'correct horse battery',
      emailVerifiedAt: DateTime.now(),
    })
    const response = await client.post('/admin/mises-a-jour').loginAs(member).withCsrfToken()
    response.assertStatus(404)
    assert.lengthOf(await Job.all(), 0)
  })
})
