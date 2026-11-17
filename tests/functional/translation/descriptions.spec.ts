import { test } from '@japa/runner'
import ace from '@adonisjs/core/services/ace'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import BrickSet from '#models/brick_set'
import ImportRun from '#models/import_run'
import TranslateDescriptions, { estimateCost } from '#commands/translate_descriptions'
import DescriptionTranslator, {
  customIdFor,
  sha1,
} from '#services/translation/description_translator'
import { seedCatalogue } from '#tests/helpers/catalogue'
import { FakeTranslationApi } from '#tests/helpers/translation'

/** seedCatalogue gives a description to 75192-1 only: add one to 8880-1 */
async function seedDescriptions() {
  await seedCatalogue()
  await db.from('sets').where('set_num', '8880-1').update({ description: 'A super car.' })
}

async function pendingCount(translator: DescriptionTranslator) {
  const summary = await translator.summary()
  return summary.count
}

async function submitBatch(translator: DescriptionTranslator) {
  const { batchId } = await translator.submit()
  return batchId!
}

async function frenchOf(setNum: string) {
  const set = await BrickSet.findByOrFail('set_num', setNum)
  return set.descriptionFr
}

test.group('Description translation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedDescriptions())

  test('sends only the descriptions without an up-to-date translation', async ({ assert }) => {
    const api = new FakeTranslationApi()
    const translator = new DescriptionTranslator(api)

    assert.deepEqual(await translator.summary(), { count: 2, characters: 53 })

    const { batchId, count } = await translator.submit()
    assert.equal(count, 2)
    const requests = api.batches.get(batchId!)!
    assert.sameMembers(
      requests.map((request) => request.text),
      ['Welcome to the largest Millennium Falcon.', 'A super car.']
    )
  })

  test('saves the translations with the hash of the English text', async ({ assert }) => {
    const api = new FakeTranslationApi()
    const translator = new DescriptionTranslator(api)
    const { batchId } = await translator.submit()

    assert.deepEqual(await translator.apply(batchId!), { saved: 2, stale: 0, failed: 0 })
    assert.equal(await frenchOf('8880-1'), 'FR: A super car.')

    const row = await db.from('sets').where('set_num', '8880-1').first()
    assert.equal(row.description_fr_source_hash, sha1('A super car.'))

    // Nothing left to translate
    assert.equal(await pendingCount(translator), 0)
  })

  test('retranslates a description that changed, and skips stale results', async ({ assert }) => {
    const api = new FakeTranslationApi()
    const translator = new DescriptionTranslator(api)
    await translator.apply(await submitBatch(translator))

    // Brickset updates a description: it is pending again
    await db.from('sets').where('set_num', '8880-1').update({ description: 'A faster car.' })
    assert.equal(await pendingCount(translator), 1)

    // ... and changes again while the batch runs: the result is stale
    const { batchId } = await translator.submit()
    await db.from('sets').where('set_num', '8880-1').update({ description: 'The fastest car.' })
    assert.deepEqual(await translator.apply(batchId!), { saved: 0, stale: 1, failed: 0 })
    assert.equal(await frenchOf('8880-1'), 'FR: A super car.')
  })

  test('keeps failed translations pending', async ({ assert }) => {
    const api = new FakeTranslationApi()
    const set = await BrickSet.findByOrFail('set_num', '8880-1')
    api.failIds.add(customIdFor(set.id, 'A super car.'))
    const warnings: string[] = []
    const translator = new DescriptionTranslator(api, (message) => warnings.push(message))

    assert.deepInclude(await translator.apply(await submitBatch(translator)), {
      saved: 1,
      failed: 1,
    })
    assert.match(warnings[0], /non traduit : refus/)
    assert.equal(await pendingCount(translator), 1)
  })

  test('estimates the cost from the volume', ({ assert }) => {
    assert.closeTo(estimateCost(9573, 12_660_795), 83.3, 1)
  })
})

test.group('translate:descriptions command', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => seedDescriptions())
  group.each.setup(() => {
    ace.ui.switchMode('raw')
    TranslateDescriptions.pollMs = 0
    return () => {
      ace.ui.switchMode('normal')
      TranslateDescriptions.apiFactory = undefined
    }
  })

  test('--dry-run shows the volume and sends nothing', async ({ assert }) => {
    const api = new FakeTranslationApi()
    TranslateDescriptions.apiFactory = () => api

    const command = await ace.create(TranslateDescriptions, ['--dry-run'])
    await command.exec()
    command.assertSucceeded()
    command.assertLogMatches(/2 description\(s\) à traduire/)
    assert.equal(api.batches.size, 0)
  })

  test('sends a batch, then saves it on the next run', async ({ assert }) => {
    const api = new FakeTranslationApi(1) // not ended at the first check
    TranslateDescriptions.apiFactory = () => api

    const first = await ace.create(TranslateDescriptions, ['--yes'])
    await first.exec()
    first.assertSucceeded()
    first.assertLogMatches(/Lot msgbatch_1 envoyé \(2 descriptions\)/)

    const second = await ace.create(TranslateDescriptions, [])
    await second.exec()
    second.assertLogMatches(/Lot msgbatch_1 en cours/)
    assert.isNull(await frenchOf('8880-1'))

    const third = await ace.create(TranslateDescriptions, [])
    await third.exec()
    third.assertSucceeded()
    assert.equal(await frenchOf('8880-1'), 'FR: A super car.')

    const run = await ImportRun.query().where('source', 'translation').firstOrFail()
    assert.equal(run.status, 'completed')
    assert.deepEqual(run.stats, { saved: 2, stale: 0, failed: 0 })
  })

  test('--wait --limit translates a few descriptions in one go', async ({ assert }) => {
    TranslateDescriptions.apiFactory = () => new FakeTranslationApi(2)

    const command = await ace.create(TranslateDescriptions, ['--yes', '--wait', '--limit=1'])
    await command.exec()
    command.assertSucceeded()
    assert.equal(await frenchOf('75192-1'), 'FR: Welcome to the largest Millennium Falcon.')
    assert.isNull(await frenchOf('8880-1'))
  })

  test('--set translates one set immediately', async ({ assert }) => {
    TranslateDescriptions.apiFactory = () => new FakeTranslationApi()

    const command = await ace.create(TranslateDescriptions, ['--set=8880-1'])
    await command.exec()
    command.assertSucceeded()
    assert.equal(await frenchOf('8880-1'), 'FR: A super car.')
  })
})
