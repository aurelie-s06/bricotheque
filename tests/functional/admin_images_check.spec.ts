import { test } from '@japa/runner'
import ace from '@adonisjs/core/services/ace'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import BrickSet from '#models/brick_set'
import Job from '#models/job'
import JobsWork from '#commands/jobs_work'
import ImageHealth from '#services/admin/image_health'
import SyncJob from '#services/jobs/sync_job'
import SiteHealth from '#services/admin/site_health'
import { seedCatalogue } from '#tests/helpers/catalogue'
import { createUser, resetRateLimits } from '#tests/helpers/auth'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const createAdmin = async () => {
  const admin = await createUser({ email: 'admin@example.com', username: 'admin' })
  admin.isAdmin = true
  await admin.save()
  return admin
}

/** Fake picture servers: 75192-1 is gone, 8880-1 does not answer, the rest are fine */
const fakeServers = (async (input: string | URL | Request) => {
  const url = String(input)
  if (url.includes('75192-1')) return new Response('', { status: 404 })
  if (url.includes('8880-1')) return new Response('', { status: 503 })
  return new Response('', { status: 200, headers: { 'content-type': 'image/jpeg' } })
}) as typeof fetch

test.group('Back office: automatic picture check', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(() => seedCatalogue())
  group.each.setup(async () => {
    SiteHealth.directory = await mkdtemp(join(tmpdir(), 'bricotheque-images-'))
  })
  group.each.teardown(() => {
    ImageHealth.fetcher = (input, init) => fetch(input, init)
    SiteHealth.directory = undefined
  })

  test('tells a picture that exists, a missing one and a server that does not answer', async ({
    assert,
  }) => {
    const answer = (status: number, type = '') =>
      (async () =>
        new Response('', { status, headers: type ? { 'content-type': type } : {} })) as typeof fetch
    ImageHealth.fetcher = answer(200, 'image/png')
    assert.equal(await ImageHealth.checkUrl('https://cdn.example.com/a.png'), 'ok')
    ImageHealth.fetcher = answer(404)
    assert.equal(await ImageHealth.checkUrl('https://cdn.example.com/a.png'), 'broken')
    ImageHealth.fetcher = answer(200, 'text/html')
    assert.equal(await ImageHealth.checkUrl('https://cdn.example.com/a.png'), 'broken')
    ImageHealth.fetcher = answer(500)
    assert.equal(await ImageHealth.checkUrl('https://cdn.example.com/a.png'), 'unknown')
    ImageHealth.fetcher = (async () => {
      throw new Error('timeout')
    }) as typeof fetch
    assert.equal(await ImageHealth.checkUrl('https://cdn.example.com/a.png'), 'unknown')
  })

  test('marks the broken pictures, then only checks again what is due', async ({ assert }) => {
    ImageHealth.fetcher = fakeServers
    const first = await ImageHealth.run({ limit: 1000 })
    assert.isAbove(first.checked, 2)
    assert.equal(first.broken, 1)
    assert.equal(first.unknown, 1)

    const falcon = await BrickSet.findByOrFail('set_num', '75192-1')
    assert.isNotNull(falcon.imgBrokenAt)
    assert.isNotNull(falcon.imgCheckedAt)
    const supercar = await BrickSet.findByOrFail('set_num', '8880-1')
    assert.isNull(supercar.imgBrokenAt)
    assert.isNull(supercar.imgCheckedAt) // tried again next time

    const second = await ImageHealth.run({ limit: 1000 })
    assert.equal(second.total, 1) // only the one without answer

    // A picture fixed on the server is no longer listed after the next check
    ImageHealth.fetcher = (async () =>
      new Response('', { status: 200, headers: { 'content-type': 'image/jpeg' } })) as typeof fetch
    await ImageHealth.run({ all: true })
    await falcon.refresh()
    assert.isNull(falcon.imgBrokenAt)
  })

  test('"check everything now" runs in the background, next to a data update', async ({
    client,
    assert,
  }) => {
    ImageHealth.fetcher = fakeServers
    const admin = await createAdmin()
    await client.post('/admin/images/verification').loginAs(admin).withCsrfToken()
    const again = await client
      .post('/admin/images/verification')
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    again.assertFlashMessage('info', 'Une vérification des images est déjà en attente ou en cours.')
    assert.lengthOf(await Job.query().where('type', 'images'), 1)

    // The images job does not block the data update button
    assert.isNotNull(await SyncJob.enqueue(admin.id))
    await db.from('jobs').where('type', 'sync').delete()

    const command = await ace.create(JobsWork, [])
    await command.exec()
    const job = await Job.query().where('type', 'images').firstOrFail()
    assert.equal(job.status, 'completed')
    assert.include(job.progress?.message ?? '', '1 cassée')

    const page = await client.get('/admin/images').loginAs(admin).withInertia()
    assert.equal(page.inertiaProps.check.job.status, 'completed')
    assert.isAbove(page.inertiaProps.check.checked, 0)
    const numbers = page.inertiaProps.items.map((item: { number: string }) => item.number)
    assert.include(numbers, '75192-1')
  })
})
