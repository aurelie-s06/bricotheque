import { test } from '@japa/runner'
import { join } from 'node:path'
import ace from '@adonisjs/core/services/ace'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import Theme from '#models/theme'
import BrickSet from '#models/brick_set'
import ImportRun from '#models/import_run'
import RebrickableImporter from '#services/rebrickable/rebrickable_importer'
import ImportRebrickable from '#commands/import_rebrickable'
import { gzippedFixtures } from '#tests/helpers/rebrickable'

async function importFixtures(name: string) {
  const directory = await gzippedFixtures(name)
  const warnings: string[] = []
  const importer = new RebrickableImporter({ batchSize: 3, onWarning: (m) => warnings.push(m) })
  const themes = await importer.importThemes(join(directory, 'themes.csv.gz'))
  const sets = await importer.importSets(join(directory, 'sets.csv.gz'))
  return { themes, sets, warnings }
}

test.group('Rebrickable import', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  /**
   * Capture the command output instead of printing it, so it can be
   * asserted and does not pollute the test report.
   */
  group.each.setup(() => {
    ace.ui.switchMode('raw')
    return () => ace.ui.switchMode('normal')
  })

  test('imports themes with their parents and unique slugs', async ({ assert }) => {
    const { themes } = await importFixtures('initial')

    assert.deepInclude(themes, { read: 11, created: 11, updated: 0, errors: 0 })

    // child listed before its parent in the CSV
    const ucs = await Theme.findOrFail(171)
    assert.equal(ucs.parentId, 158)

    const namesakes = await Theme.query().whereIn('id', [1, 18, 158, 498])
    const slugs = Object.fromEntries(namesakes.map((theme) => [theme.id, theme.slug]))
    assert.deepEqual(slugs, {
      1: 'technic',
      18: 'technic-star-wars',
      158: 'star-wars',
      498: 'books-technic',
    })
  })

  test('imports sets with number, variant, slug and kind', async ({ assert }) => {
    const { sets, warnings } = await importFixtures('initial')

    assert.deepEqual(sets, {
      read: 9,
      created: 7,
      updated: 0,
      unchanged: 0,
      deleted: 0,
      skipped: 1,
      errors: 1,
    })
    assert.lengthOf(warnings, 2)

    const falcon = await BrickSet.findByOrFail('set_num', '75192-1')
    assert.equal(falcon.number, '75192')
    assert.equal(falcon.variant, 1)
    assert.equal(falcon.slug, 'millennium-falcon')
    assert.equal(falcon.name, 'Millennium Falcon™')
    assert.equal(falcon.themeId, 171)
    assert.equal(falcon.numParts, 7541)
    assert.equal(falcon.kind, 'set')
    assert.equal(falcon.imgUrl, 'https://cdn.rebrickable.com/media/sets/75192-1.jpg')

    const variant = await BrickSet.findByOrFail('set_num', '75192-2')
    assert.equal(variant.variant, 2)
    assert.equal(variant.name, 'Millennium Falcon, "UCS" bonus')
    assert.isNull(variant.imgUrl)

    const allSets = await BrickSet.all()
    const kinds = Object.fromEntries(allSets.map((set) => [set.setNum, set.kind]))
    assert.equal(kinds['0003977811-1'], 'book')
    assert.equal(kinds['KEYCHAIN-1'], 'gear')
    assert.equal(kinds['10003-1'], 'parts')
    assert.equal(kinds['1476-1'], 'bundle')
    assert.notProperty(kinds, 'BAD-1')
  })

  test('running the import again upserts without duplicates', async ({ assert }) => {
    await importFixtures('initial')

    // Data enriched later by Brickset must survive a Rebrickable re-import
    await db.from('sets').where('set_num', '8880-1').update({ rrp_eur: 199.99, subtheme: 'Model' })

    const again = await importFixtures('initial')
    assert.deepInclude(again.sets, { created: 0, updated: 0, unchanged: 7 })
    assert.deepInclude(again.themes, { created: 0, updated: 0, unchanged: 11 })

    const updated = await importFixtures('updated')
    assert.deepEqual(updated.sets, {
      read: 8,
      created: 1,
      updated: 1,
      unchanged: 6,
      deleted: 0,
      skipped: 0,
      errors: 0,
    })

    const [{ total }] = await db.from('sets').count('* as total')
    assert.equal(Number(total), 8)

    const supercar = await BrickSet.findByOrFail('set_num', '8880-1')
    assert.equal(supercar.name, 'Super Car (Supercar)')
    assert.equal(supercar.slug, 'super-car-supercar')
    assert.strictEqual(supercar.rrpEur, 199.99)
    assert.equal(supercar.subtheme, 'Model')
  })

  test('the command imports the files and records import runs', async ({ assert }) => {
    const directory = await gzippedFixtures('initial')

    const command = await ace.create(ImportRebrickable, ['--skip-download', `--dir=${directory}`])
    await command.exec()
    command.assertSucceeded()
    command.assertLogMatches(/Set BAD-1 ignoré : thème 99999 inconnu/)

    const runs = await ImportRun.query().where('source', 'rebrickable').orderBy('id')
    assert.deepEqual(
      runs.map((run) => [run.type, run.status]),
      [
        ['themes', 'completed'],
        ['sets', 'completed'],
        ['minifigs', 'completed'],
        ['set_minifigs', 'completed'],
      ]
    )
    assert.deepInclude(runs[1].stats!, { created: 7, skipped: 1, errors: 1 })
    assert.deepInclude(runs[3].stats!, { created: 8, setsRecounted: 4, minifigsRecomputed: 5 })
    assert.isNotNull(runs[1].finishedAt)
    const imported = await BrickSet.all()
    assert.lengthOf(imported, 7)
  })

  test('the command fails cleanly when files are missing', async () => {
    const command = await ace.create(ImportRebrickable, [
      '--skip-download',
      '--dir=/nonexistent/rebrickable',
    ])
    await command.exec()

    command.assertFailed()
    command.assertLogMatches(
      /\/nonexistent\/rebrickable\/themes\.csv\.gz introuvable : relance sans --skip-download/
    )
  })
})
