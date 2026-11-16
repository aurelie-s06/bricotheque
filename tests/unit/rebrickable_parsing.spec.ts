import { test } from '@japa/runner'
import { makeSlug, parseSetNum, toInteger } from '#services/rebrickable/parsing'
import { buildKindResolver } from '#services/rebrickable/set_kinds'

test.group('Rebrickable parsing', () => {
  test('splits set numbers into number and variant', ({ assert }) => {
    assert.deepEqual(parseSetNum('75192-1'), { number: '75192', variant: 1 })
    assert.deepEqual(parseSetNum('0011-2'), { number: '0011', variant: 2 })
    assert.deepEqual(parseSetNum('WIZARD-CARDS-1'), { number: 'WIZARD-CARDS', variant: 1 })
    assert.deepEqual(parseSetNum('NOVARIANT'), { number: 'NOVARIANT', variant: 1 })
  })

  test('builds clean slugs', ({ assert }) => {
    assert.equal(makeSlug('Millennium Falcon™', 'set'), 'millennium-falcon')
    assert.equal(makeSlug('Pokémon', 'set'), 'pokemon')
    assert.equal(makeSlug("Gabby's Dollhouse", 'set'), 'gabbys-dollhouse')
    assert.equal(makeSlug('Star Wars: Episode IV–VI', 'set'), 'star-wars-episode-iv-vi')
    assert.equal(makeSlug('家', 'set'), 'set')
  })

  test('parses integers', ({ assert }) => {
    assert.equal(toInteger('2017'), 2017)
    assert.isNull(toInteger(''))
    assert.isNull(toInteger('12.5'))
  })

  test('resolves the kind from the root theme', ({ assert }) => {
    const kindOf = buildKindResolver([
      { id: 501, parentId: null }, // Gear
      { id: 503, parentId: 501 },
      { id: 497, parentId: null }, // Books
      { id: 761, parentId: 497 },
      { id: 158, parentId: null }, // Star Wars
      { id: 171, parentId: 158 },
    ])

    assert.equal(kindOf(503), 'gear')
    assert.equal(kindOf(761), 'book')
    assert.equal(kindOf(171), 'set')
    assert.equal(kindOf(12345), 'set')
  })
})
