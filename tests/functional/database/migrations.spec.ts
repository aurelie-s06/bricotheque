import { test } from '@japa/runner'
import ace from '@adonisjs/core/services/ace'
import db from '@adonisjs/lucid/services/db'

const APP_TABLES = [
  'import_runs',
  'jobs',
  'minifigs',
  'password_reset_tokens',
  'rate_limits',
  'set_minifigs',
  'sets',
  'themes',
  'user_minifigs',
  'user_sets',
  'users',
]

async function listTables(): Promise<string[]> {
  const [rows] = await db.rawQuery('SHOW TABLES')
  return rows
    .map((row: Record<string, string>) => Object.values(row)[0])
    .filter((name: string) => !name.startsWith('adonis_schema'))
    .sort()
}

async function runAce(command: string, args: string[] = []) {
  const result = await ace.exec(command, [...args, '--no-schema-generate', '--compact-output'])
  return result.exitCode
}

test.group('Database migrations', () => {
  test('migrations run up, roll back and run up again', async ({ assert }) => {
    assert.deepEqual(await listTables(), APP_TABLES)

    assert.equal(await runAce('migration:reset'), 0)
    assert.deepEqual(await listTables(), [])

    assert.equal(await runAce('migration:run'), 0)
    assert.deepEqual(await listTables(), APP_TABLES)
  }).timeout(60_000)

  test('search and filter indexes exist', async ({ assert }) => {
    const indexesOf = async (table: string) => {
      const [rows] = await db.rawQuery(`SHOW INDEX FROM \`${table}\``)
      return rows.map((row: { Column_name: string; Index_type: string; Non_unique: number }) => ({
        column: row.Column_name,
        type: row.Index_type,
        unique: row.Non_unique === 0,
      }))
    }

    const sets = await indexesOf('sets')
    assert.deepInclude(sets, { column: 'set_num', type: 'BTREE', unique: true })
    for (const column of ['number', 'theme_id', 'year', 'availability_status']) {
      assert.isTrue(
        sets.some((index: { column: string }) => index.column === column),
        `index on sets.${column}`
      )
    }
    assert.deepInclude(sets, { column: 'name', type: 'FULLTEXT', unique: false })

    const minifigs = await indexesOf('minifigs')
    assert.deepInclude(minifigs, { column: 'fig_num', type: 'BTREE', unique: true })
    assert.deepInclude(minifigs, { column: 'name', type: 'FULLTEXT', unique: false })
    assert.isTrue(minifigs.some((index: { column: string }) => index.column === 'main_theme_id'))
  })
})
