import { join } from 'node:path'
import db from '@adonisjs/lucid/services/db'
import RebrickableImporter from '#services/rebrickable/rebrickable_importer'
import SetMinifigLinker from '#services/rebrickable/set_minifig_linker'
import { gzippedFixtures } from '#tests/helpers/rebrickable'

/**
 * Catalogue of tests/fixtures/rebrickable/initial (7 products, 3 real sets:
 * 75192-1, 75192-2 and 8880-1), with some Brickset data.
 */
export async function seedCatalogue() {
  const directory = await gzippedFixtures('initial')
  const importer = new RebrickableImporter()
  await importer.importThemes(join(directory, 'themes.csv.gz'))
  await importer.importSets(join(directory, 'sets.csv.gz'))
  await importer.importMinifigs(join(directory, 'minifigs.csv.gz'))
  const linker = new SetMinifigLinker()
  await linker.importLinks(
    join(directory, 'inventories.csv.gz'),
    join(directory, 'inventory_minifigs.csv.gz')
  )
  await linker.refreshAggregates()

  await db.from('sets').where('set_num', '75192-1').update({
    rrp_eur: 849.99,
    rrp_usd: 849.99,
    availability_status: 'available',
    date_first_available: '2017-10-01',
    date_last_available: '2026-12-31',
    description: 'Welcome to the largest Millennium Falcon.',
    brickset_id: 26725,
  })
  await db.from('sets').where('set_num', '8880-1').update({
    rrp_eur: 199.99,
    availability_status: 'retired',
  })
}

/**
 * Adds `count` Technic sets (theme 1) to test the pagination.
 */
export async function addTechnicSets(count: number) {
  await db.table('sets').multiInsert(
    Array.from({ length: count }, (_, index) => ({
      set_num: `9${String(index).padStart(4, '0')}-1`,
      number: `9${String(index).padStart(4, '0')}`,
      variant: 1,
      name: `Technic model ${index}`,
      slug: `technic-model-${index}`,
      year: 2000,
      theme_id: 1,
      num_parts: 100,
      created_at: '2026-01-01 00:00:00',
    }))
  )
}
