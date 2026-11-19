import { test } from '@japa/runner'
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import DbBackup, { KEEP_BACKUPS } from '#services/admin/db_backup'

test.group('Database backups', (group) => {
  group.each.setup(async () => {
    DbBackup.directory = await mkdtemp(join(tmpdir(), 'bricotheque-backups-'))
  })
  group.each.teardown(() => {
    DbBackup.directory = undefined
  })

  test('writes the tables and their rows, JSON columns included', async ({ assert }) => {
    // The backup has its own connection: the row must really be saved
    const [id] = await db.table('import_runs').insert({
      source: 'rebrickable',
      type: 'sets',
      status: 'completed',
      stats: JSON.stringify({ read: 12, created: 3 }),
      started_at: '2026-11-19 03:30:00',
    })
    try {
      const file = await DbBackup.run()
      assert.match(file.name, /^bricotheque-\d{4}-\d{2}-\d{2}-\d{4}\.sql\.gz$/)
      const sql = gunzipSync(await readFile(join(DbBackup.folder(), file.name))).toString('utf8')
      assert.include(sql, 'CREATE TABLE `users`')
      assert.include(sql, 'CREATE TABLE `sets`')
      assert.include(sql, '{\\"read\\":12,\\"created\\":3}')
      assert.include(sql, "'2026-11-19 03:30:00'")
      assert.notInclude(sql, '[object Object]')
      assert.include(sql, 'SET FOREIGN_KEY_CHECKS = 1;')
    } finally {
      await db.from('import_runs').where('id', id).delete()
    }
  })

  test('keeps the last 4 backups only', async ({ assert }) => {
    for (let day = 1; day <= 9; day++) {
      const name = `bricotheque-2026-10-${String(day).padStart(2, '0')}-0330.sql.gz`
      await writeFile(join(DbBackup.folder(), name), 'old')
    }
    await writeFile(join(DbBackup.folder(), 'notes.txt'), 'not a backup')
    await DbBackup.prune()
    const files = await readdir(DbBackup.folder())
    const names = files.sort()
    assert.lengthOf(names, KEEP_BACKUPS + 1)
    assert.include(names, 'notes.txt')
    assert.notInclude(names, 'bricotheque-2026-10-01-0330.sql.gz')
    assert.include(names, 'bricotheque-2026-10-09-0330.sql.gz')
  })

  test('a new backup is due once a week', async ({ assert }) => {
    assert.isTrue(await DbBackup.isDue())
    await DbBackup.run()
    assert.isFalse(await DbBackup.isDue())
    assert.isTrue(await DbBackup.isDue(DateTime.now().plus({ days: 7 })))
  })
})
