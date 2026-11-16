import { test } from '@japa/runner'
import { join } from 'node:path'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import ace from '@adonisjs/core/services/ace'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import BrickSet from '#models/brick_set'
import ImportRun from '#models/import_run'
import ImportBrickset from '#commands/import_brickset'
import RebrickableImporter from '#services/rebrickable/rebrickable_importer'
import BricksetImporter, {
  type BricksetImporterOptions,
} from '#services/brickset/brickset_importer'
import { gzippedFixtures } from '#tests/helpers/rebrickable'
import { FakeBricksetApi, bricksetFixtures, bricksetSet } from '#tests/helpers/brickset'

const today = DateTime.fromISO('2026-11-16', { zone: 'utc' })

/** Catalogue of tests/fixtures/rebrickable/initial: sets from 1991 to 2022 */
async function seedCatalogue() {
  const directory = await gzippedFixtures('initial')
  const importer = new RebrickableImporter()
  await importer.importThemes(join(directory, 'themes.csv.gz'))
  await importer.importSets(join(directory, 'sets.csv.gz'))
}

function makeImporter(api: FakeBricksetApi, options: Partial<BricksetImporterOptions> = {}) {
  return new BricksetImporter(api, {
    cacheDirectory: join(tmpdir(), `brickset-cache-${randomUUID()}`),
    delayMs: 0,
    today,
    ...options,
  })
}

async function findSet(setNum: string) {
  return BrickSet.findByOrFail('set_num', setNum)
}

async function setField<Field extends keyof BrickSet>(setNum: string, field: Field) {
  const set = await findSet(setNum)
  return set[field]
}

test.group('Brickset import', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('enriches matching sets with prices, dates, subtheme and description', async ({
    assert,
  }) => {
    await seedCatalogue()
    const api = new FakeBricksetApi(bricksetFixtures())
    const outcome = await makeImporter(api).importAll()

    assert.isTrue(outcome.finished)
    assert.deepInclude(outcome.stats, { read: 4, updated: 3, unchanged: 0, skipped: 1, errors: 0 })

    // one call per year, from 2027 down to 1991
    assert.equal(outcome.stats.apiCalls, 37)
    assert.equal(api.calls[0].year, '2027')
    assert.equal(api.calls.at(-1)!.year, '1991')

    const falcon = await findSet('75192-1')
    assert.equal(falcon.bricksetId, 26725)
    assert.strictEqual(falcon.rrpEur, 849.99)
    assert.strictEqual(falcon.rrpUsd, 849.99)
    assert.strictEqual(falcon.rrpGbp, 734.99)
    assert.equal(falcon.dateFirstAvailable?.toISODate(), '2017-10-01')
    assert.equal(falcon.dateLastAvailable?.toISODate(), '2026-12-31')
    assert.equal(falcon.subtheme, 'Ultimate Collector Series')
    assert.equal(
      falcon.description,
      'Welcome to the largest LEGO® Star Wars Millennium Falcon we’ve ever created.\n\nIncludes 7 minifigures.'
    )
    assert.isNotNull(falcon.bricksetSyncedAt)

    // Rebrickable data is untouched
    assert.equal(falcon.name, 'Millennium Falcon™')
    assert.equal(falcon.numParts, 7541)

    const supercar = await findSet('8880-1')
    assert.isNull(supercar.subtheme) // "{None}"
    assert.isNull(supercar.rrpEur)
  })

  test('computes the availability status of every set', async ({ assert }) => {
    await seedCatalogue()
    // Recent sets: one released on Brickset, one not released yet, one without data
    await db.table('sets').multiInsert(
      [
        ['76000-1', 2026],
        ['77000-1', 2027],
        ['78000-1', 2025],
      ].map(([setNum, year]) => ({
        set_num: setNum,
        number: String(setNum).split('-')[0],
        variant: 1,
        name: `Set ${setNum}`,
        slug: 'set',
        year,
        theme_id: 158,
        created_at: '2026-01-01 00:00:00',
      }))
    )
    const api = new FakeBricksetApi([
      ...bricksetFixtures(),
      bricksetSet({ number: '76000', year: 2026, launchDate: '2026-03-01T00:00:00Z' }),
      bricksetSet({ number: '77000', year: 2027, launchDate: '2027-01-01T00:00:00Z' }),
    ])
    await makeImporter(api).importAll()

    const allSets = await BrickSet.all()
    const statuses = Object.fromEntries(allSets.map((set) => [set.setNum, set.availabilityStatus]))
    assert.deepInclude(statuses, {
      '75192-1': 'available', // exit date in the future
      '0003977811-1': 'retired', // exit date in the past
      '8880-1': 'retired', // 1994, no date
      '75192-2': 'retired', // not on Brickset, released more than 3 years ago
      '76000-1': 'available', // released in 2026, no exit date yet
      '77000-1': 'unknown', // not released yet
      '78000-1': 'unknown', // recent, no data
    })
  })

  test('reads several pages for a year', async ({ assert }) => {
    await seedCatalogue()
    const api = new FakeBricksetApi([
      ...bricksetFixtures(),
      bricksetSet({ number: '10179', year: 2017 }),
    ])
    const outcome = await makeImporter(api, { pageSize: 2 }).importAll()

    const pages2017 = api.calls
      .filter((call) => call.year === '2017')
      .map((call) => call.pageNumber)
    assert.deepEqual(pages2017, [1, 2])
    assert.equal(outcome.stats.read, 5)
  })

  test('stops before the daily quota and resumes where it stopped', async ({ assert }) => {
    await seedCatalogue()

    // 10 calls allowed, 2 kept in reserve: 8 years fetched (2027 to 2020)
    const today1 = new FakeBricksetApi(bricksetFixtures())
    const first = await makeImporter(today1, { dailyLimit: 10 }).importAll()
    assert.isFalse(first.finished)
    assert.equal(first.stats.apiCalls, 8)
    assert.equal(first.cursor.years[first.cursor.yearIndex], 2019)
    assert.equal(first.cursor.page, 1)
    assert.isNull(await setField('75192-1', 'bricksetId')) // 2017 not reached yet

    // Next day: the quota is reset
    const today2 = new FakeBricksetApi(bricksetFixtures())
    const second = await makeImporter(today2, { dailyLimit: 100 }).importAll(first.cursor)
    assert.isTrue(second.finished)
    assert.equal(today2.calls[0].year, '2019')
    assert.equal(second.stats.apiCalls, 29)
    assert.equal(await setField('75192-1', 'bricksetId'), 26725)
  })

  test('reuses cached pages instead of calling the API again', async ({ assert }) => {
    await seedCatalogue()
    const cacheDirectory = await mkdtemp(join(tmpdir(), 'brickset-cache-'))

    await makeImporter(new FakeBricksetApi(bricksetFixtures()), { cacheDirectory }).importAll()

    const api = new FakeBricksetApi(bricksetFixtures())
    const again = await makeImporter(api, { cacheDirectory }).importAll()
    assert.equal(again.stats.apiCalls, 0)
    assert.equal(again.stats.cachedPages, 37)
    assert.deepInclude(again.stats, { updated: 0, unchanged: 3 })

    const refreshed = await makeImporter(new FakeBricksetApi(bricksetFixtures()), {
      cacheDirectory,
      cacheHours: 0,
    }).importAll()
    assert.equal(refreshed.stats.apiCalls, 37)
  })

  test('matches random packs numbered with variant 0', async ({ assert }) => {
    await seedCatalogue()
    await db.table('sets').insert({
      set_num: '71048-0',
      number: '71048',
      variant: 0,
      name: 'Series 27 - Random Box',
      slug: 'series-27-random-box',
      year: 2025,
      theme_id: 158,
      created_at: '2026-01-01 00:00:00',
    })
    const api = new FakeBricksetApi([
      bricksetSet({
        setID: 50772,
        number: '71048',
        numberVariant: 0,
        year: 2025,
        category: 'Random',
      }),
    ])
    const outcome = await makeImporter(api).importAll()

    assert.deepInclude(outcome.stats, { read: 1, updated: 1, errors: 0 })
    assert.equal(await setField('71048-0', 'bricksetId'), 50772)
  })

  test('enriches a single set', async ({ assert }) => {
    await seedCatalogue()
    const api = new FakeBricksetApi(bricksetFixtures())
    const outcome = await makeImporter(api).importOne('75192-1')

    assert.deepEqual(api.calls, [{ setNumber: '75192-1', extendedData: 1 }])
    assert.deepInclude(outcome.stats, { read: 1, updated: 1, apiCalls: 1 })
    const falcon = await findSet('75192-1')
    assert.equal(falcon.availabilityStatus, 'available')
    assert.equal(await setField('8880-1', 'availabilityStatus'), 'unknown') // not touched

    await assert.rejects(() => makeImporter(api).importOne('00000-1'), /introuvable/)
  })
})

test.group('import:brickset command', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(async () => {
    ace.ui.switchMode('raw')
    ImportBrickset.cacheDirectory = await mkdtemp(join(tmpdir(), 'brickset-cache-'))
    return () => {
      ace.ui.switchMode('normal')
      ImportBrickset.apiFactory = undefined
      ImportBrickset.cacheDirectory = undefined
    }
  })

  test('records an interrupted run with its cursor, then resumes it', async ({ assert }) => {
    await seedCatalogue()
    // 96 calls already made today: 2 left before the margin
    let api = new FakeBricksetApi(bricksetFixtures(), 96)
    ImportBrickset.apiFactory = () => api

    const first = await ace.create(ImportBrickset, ['--refresh'])
    await first.exec()
    first.assertSucceeded()
    first.assertLogMatches(/Reprends demain avec : node ace import:brickset --resume/)

    const interrupted = await ImportRun.query().where('source', 'brickset').firstOrFail()
    assert.equal(interrupted.status, 'interrupted')
    assert.deepInclude(interrupted.cursor!, { yearIndex: 2, page: 1 })

    api = new FakeBricksetApi(bricksetFixtures())
    const second = await ace.create(ImportBrickset, ['--resume', '--refresh'])
    await second.exec()
    second.assertSucceeded()
    second.assertLogMatches(/Reprise à l'année 2025, page 1/)
    assert.equal(api.calls[0].year, '2025')

    const runs = await ImportRun.query().where('source', 'brickset').orderBy('id')
    assert.deepEqual(
      runs.map((run) => run.status),
      ['interrupted', 'completed']
    )
    assert.isNull(runs[1].cursor)
  })

  test('--resume does nothing when there is nothing to resume', async ({ assert }) => {
    await seedCatalogue()
    const api = new FakeBricksetApi(bricksetFixtures())
    ImportBrickset.apiFactory = () => api

    const command = await ace.create(ImportBrickset, ['--resume'])
    await command.exec()
    command.assertSucceeded()
    command.assertLogMatches(/rien à faire/)
    assert.lengthOf(api.calls, 0)
    assert.lengthOf(await ImportRun.query().where('source', 'brickset'), 0)
  })

  test('enriches one set with --set', async ({ assert }) => {
    await seedCatalogue()
    ImportBrickset.apiFactory = () => new FakeBricksetApi(bricksetFixtures())

    const command = await ace.create(ImportBrickset, ['--set=75192-1'])
    await command.exec()
    command.assertSucceeded()
    assert.equal(await setField('75192-1', 'rrpGbp'), 734.99)
  })

  test('fails cleanly with an invalid key', async () => {
    ImportBrickset.apiFactory = () => new FakeBricksetApi([], 0, false)

    const command = await ace.create(ImportBrickset, [])
    await command.exec()
    command.assertFailed()
    command.assertLogMatches(/Clé API Brickset refusée/)
  })
})

test.group('Brickset import: renumbered sets', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a Brickset id moves to the set that now matches it', async ({ assert }) => {
    await seedCatalogue()
    // 8880-1 wrongly holds the Brickset id of 75192-1
    await db.from('sets').where('set_num', '8880-1').update({ brickset_id: 26725 })

    const api = new FakeBricksetApi(bricksetFixtures().filter((set) => set.number === '75192'))
    await makeImporter(api).importOne('75192-1')

    assert.equal(await setField('75192-1', 'bricksetId'), 26725)
    assert.isNull(await setField('8880-1', 'bricksetId'))
  })
})
