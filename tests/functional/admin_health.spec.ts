import { test } from '@japa/runner'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ace from '@adonisjs/core/services/ace'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import JobsWork from '#commands/jobs_work'
import SiteHealth from '#services/admin/site_health'
import { TestMail } from '#mails/account_mails'
import { FakeBricksetApi } from '#tests/helpers/brickset'
import { createUser, resetRateLimits } from '#tests/helpers/auth'

const createAdmin = async () => {
  const admin = await createUser({ email: 'admin@example.com', username: 'admin' })
  admin.isAdmin = true
  await admin.save()
  return admin
}

test.group('Back office: site health', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => resetRateLimits())
  group.each.setup(async () => {
    SiteHealth.directory = await mkdtemp(join(tmpdir(), 'bricotheque-health-'))
  })
  group.each.teardown(() => {
    SiteHealth.directory = undefined
    SiteHealth.bricksetFactory = undefined
    mail.restore()
  })

  test('the cron check turns OK once jobs:work has run', async ({ client, assert }) => {
    const admin = await createAdmin()
    const before = await client.get('/admin/sante').loginAs(admin).withInertia()
    before.assertInertiaComponent('admin/health')
    assert.equal(before.inertiaProps.cron.status, 'error')

    const command = await ace.create(JobsWork, [])
    await command.exec()
    command.assertSucceeded()

    const after = await client.get('/admin/sante').loginAs(admin).withInertia()
    assert.equal(after.inertiaProps.cron.status, 'ok')
    assert.equal(after.inertiaProps.database.status, 'ok')
  })

  test('shows the end of the logs, hides idle lines, clears a log', async ({ client, assert }) => {
    const admin = await createAdmin()
    await writeFile(
      SiteHealth.logPath('jobs'),
      '[ info ] Aucun job en attente\n\u001B[32m[ success ] Job 3 terminé\u001B[39m\n[ info ] Aucun job en attente\n'
    )

    const page = await client.get('/admin/sante').loginAs(admin).withInertia()
    const jobs = page.inertiaProps.logs[0]
    assert.deepEqual(jobs.lines, ['[ success ] Job 3 terminé'])
    assert.equal(jobs.hiddenIdle, 2)
    assert.isFalse(page.inertiaProps.logs[1].exists)

    const all = await client.get('/admin/sante?tout=1').loginAs(admin).withInertia()
    assert.lengthOf(all.inertiaProps.logs[0].lines, 3)

    await client.post('/admin/sante/journaux/jobs/vider').loginAs(admin).withCsrfToken()
    assert.equal(await readFile(SiteHealth.logPath('jobs'), 'utf8'), '')

    const unknown = await client
      .post('/admin/sante/journaux/secret/vider')
      .loginAs(admin)
      .withCsrfToken()
    unknown.assertStatus(404)
  })

  test('sends a test email and checks the Brickset quota', async ({ client, assert }) => {
    const { mails } = mail.fake()
    const admin = await createAdmin()

    await client.post('/admin/sante/email').loginAs(admin).withCsrfToken()
    mails.assertSent(TestMail, ({ message }) => message.hasTo('admin@example.com'))

    SiteHealth.bricksetFactory = () => new FakeBricksetApi([], 42)
    const quota = await client
      .post('/admin/sante/brickset')
      .loginAs(admin)
      .withCsrfToken()
      .redirects(0)
    assert.include(quota.flashMessages().info, '42')
    assert.include(quota.flashMessages().info, '58')
  })
})
