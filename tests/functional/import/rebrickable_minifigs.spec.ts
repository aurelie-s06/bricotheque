import { test } from '@japa/runner'
import { join } from 'node:path'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import BrickSet from '#models/brick_set'
import Minifig from '#models/minifig'
import RebrickableImporter from '#services/rebrickable/rebrickable_importer'
import SetMinifigLinker from '#services/rebrickable/set_minifig_linker'
import { gzippedFixtures } from '#tests/helpers/rebrickable'

/**
 * Fixture summary (tests/fixtures/rebrickable/initial):
 * - 75192-1 (Star Wars UCS, 2017) has two inventory versions: only v2 counts
 * - 75192-2 (Star Wars UCS, 2017), 8880-1 (Technic, 1994)
 * - 0003977811-1 is a book (Books, 2022)
 */
async function importAll(name: string, { withCatalogue = true } = {}) {
  const directory = await gzippedFixtures(name)
  const importer = new RebrickableImporter({ batchSize: 3 })
  if (withCatalogue) {
    await importer.importThemes(join(directory, 'themes.csv.gz'))
    await importer.importSets(join(directory, 'sets.csv.gz'))
  }
  const minifigs = await importer.importMinifigs(join(directory, 'minifigs.csv.gz'))

  const warnings: string[] = []
  const linker = new SetMinifigLinker({ batchSize: 3, onWarning: (m) => warnings.push(m) })
  const links = await linker.importLinks(
    join(directory, 'inventories.csv.gz'),
    join(directory, 'inventory_minifigs.csv.gz')
  )
  const aggregates = await linker.refreshAggregates()
  return { minifigs, links, aggregates, warnings }
}

async function figsOf(setNum: string) {
  const set = await BrickSet.query().where('set_num', setNum).preload('minifigs').firstOrFail()
  return Object.fromEntries(
    set.minifigs.map((minifig) => [minifig.figNum, minifig.$extras.pivot_quantity])
  )
}

async function findMinifig(figNum: string) {
  return Minifig.findByOrFail('fig_num', figNum)
}

test.group('Rebrickable import: minifigs', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('imports minifigs with slug and image', async ({ assert }) => {
    const { minifigs } = await importAll('initial')

    assert.deepEqual(minifigs, {
      read: 7,
      created: 7,
      updated: 0,
      unchanged: 0,
      deleted: 0,
      skipped: 0,
      errors: 0,
    })
    const stormtrooper = await findMinifig('fig-000003')
    assert.equal(stormtrooper.name, 'Stormtrooper, White')
    assert.equal(stormtrooper.slug, 'stormtrooper-white')
    assert.equal(stormtrooper.numParts, 4)
    assert.isNull(stormtrooper.imgUrl)
    const han = await findMinifig('fig-000001')
    assert.equal(han.imgUrl, 'https://cdn.rebrickable.com/media/sets/fig-000001.jpg')
  })

  test('links sets to the minifigs of their latest inventory version', async ({ assert }) => {
    const { links, warnings } = await importAll('initial')

    assert.deepEqual(links, {
      read: 12,
      created: 8,
      updated: 0,
      unchanged: 0,
      deleted: 0,
      skipped: 4, // 2 rows of the old version, 1 unknown set, 1 unknown minifig
      errors: 0,
    })
    assert.isTrue(warnings.some((warning) => warning.includes('fig-999999')))

    // version 2 only: the pilot of version 1 is not linked
    assert.deepEqual(await figsOf('75192-1'), {
      'fig-000001': 1,
      'fig-000002': 1,
      'fig-000003': 2,
    })
    assert.deepEqual(await figsOf('8880-1'), { 'fig-000001': 1, 'fig-000007': 1 })

    const han = await Minifig.query().where('fig_num', 'fig-000001').preload('sets').firstOrFail()
    assert.sameMembers(
      han.sets.map((set) => set.setNum),
      ['75192-1', '75192-2', '8880-1']
    )
  })

  test('computes num_minifigs, main theme and first year', async ({ assert }) => {
    const { aggregates } = await importAll('initial')
    assert.deepEqual(aggregates, { setsRecounted: 4, minifigsRecomputed: 5 })

    const allSets = await BrickSet.all()
    const counts = Object.fromEntries(allSets.map((set) => [set.setNum, set.numMinifigs]))
    assert.include(counts, {
      '75192-1': 4, // quantities included
      '75192-2': 1,
      '8880-1': 2,
      '0003977811-1': 2,
      'KEYCHAIN-1': 0,
    })

    // 2 Star Wars sets vs 1 Technic set: Star Wars wins; first year from the 1994 Technic set
    const han = await findMinifig('fig-000001')
    assert.equal(han.mainThemeId, 158)
    assert.equal(han.yearFirst, 1994)

    // A real set wins over a book, even with the same number of appearances
    const driver = await findMinifig('fig-000007')
    assert.equal(driver.mainThemeId, 1)
    assert.equal(driver.yearFirst, 1994)

    // Only in a book: the book's root theme is used
    const wizard = await findMinifig('fig-000006')
    assert.equal(wizard.mainThemeId, 497)
    assert.equal(wizard.yearFirst, 2022)

    // In no set at all (or only in an old inventory version)
    for (const figNum of ['fig-000004', 'fig-000005']) {
      const orphan = await findMinifig(figNum)
      assert.isNull(orphan.mainThemeId)
      assert.isNull(orphan.yearFirst)
    }
  })

  test('a minifig theme points to the theme model', async ({ assert }) => {
    await importAll('initial')
    const han = await Minifig.query()
      .where('fig_num', 'fig-000001')
      .preload('mainTheme')
      .firstOrFail()
    assert.equal(han.mainTheme.name, 'Star Wars')
  })

  test('re-importing updates links and computed fields without duplicates', async ({ assert }) => {
    await importAll('initial')

    const same = await importAll('initial', { withCatalogue: false })
    assert.deepInclude(same.minifigs, { created: 0, updated: 0, unchanged: 7 })
    assert.deepInclude(same.links, { created: 0, updated: 0, deleted: 0, unchanged: 8 })
    assert.deepEqual(same.aggregates, { setsRecounted: 0, minifigsRecomputed: 0 })

    const updated = await importAll('updated', { withCatalogue: false })
    assert.deepInclude(updated.minifigs, { created: 1, updated: 1, unchanged: 6 })
    assert.deepInclude(updated.links, { created: 1, updated: 1, deleted: 1, unchanged: 6 })

    const [{ total }] = await db.from('set_minifigs').count('* as total')
    assert.equal(Number(total), 8)

    const chewbacca = await findMinifig('fig-000002')
    assert.equal(chewbacca.name, 'Chewbacca (Wookiee)')
    assert.deepEqual(await figsOf('75192-1'), {
      'fig-000001': 1,
      'fig-000002': 1,
      'fig-000003': 3,
    })
    assert.deepEqual(await figsOf('0003977811-1'), { 'fig-000006': 1 })

    const updatedSets = await BrickSet.all()
    const sets = Object.fromEntries(updatedSets.map((set) => [set.setNum, set.numMinifigs]))
    assert.include(sets, { '75192-1': 5, '75192-2': 2, '0003977811-1': 1 })

    const luke = await findMinifig('fig-000008')
    assert.equal(luke.mainThemeId, 158)
    assert.equal(luke.yearFirst, 2017)
  })

  test('links cannot be imported before sets and minifigs', async ({ assert }) => {
    const directory = await gzippedFixtures('initial')
    const linker = new SetMinifigLinker()
    await assert.rejects(
      () =>
        linker.importLinks(
          join(directory, 'inventories.csv.gz'),
          join(directory, 'inventory_minifigs.csv.gz')
        ),
      /avant leurs liens/
    )
  })
})
