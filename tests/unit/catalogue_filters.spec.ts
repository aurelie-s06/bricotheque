import { test } from '@japa/runner'
import { filtersToQuery, parseSetFilters } from '#services/catalogue/set_filters'
import { setNumCandidates, setPath } from '#helpers/urls'
import ThemeTree from '#services/catalogue/theme_tree'

test.group('Catalogue: filters from the query string', () => {
  test('reads valid values', ({ assert }) => {
    const filters = parseSetFilters({
      q: '  millennium   falcon ',
      theme: 'star-wars',
      year_min: '2015',
      year_max: '2020',
      parts_min: '1000',
      price_max: '99,99',
      status: 'retired',
      type: 'all',
      sort: 'price_desc',
      page: '3',
    })
    assert.deepEqual(filters, {
      q: 'millennium falcon',
      theme: 'star-wars',
      yearMin: 2015,
      yearMax: 2020,
      partsMin: 1000,
      partsMax: null,
      priceMin: null,
      priceMax: 99.99,
      status: 'retired',
      type: 'all',
      sort: 'price_desc',
      page: 3,
    })
  })

  test('ignores invalid values and uses defaults', ({ assert }) => {
    const filters = parseSetFilters({
      year_min: 'abc',
      parts_max: '-5',
      status: 'stolen',
      type: 'robots',
      sort: 'random',
      page: '0',
      q: ['array'],
    })
    assert.deepInclude(filters, {
      q: null,
      yearMin: null,
      partsMax: null,
      status: null,
      type: 'set',
      sort: null,
      page: 1,
    })
  })

  test('swaps reversed ranges', ({ assert }) => {
    const filters = parseSetFilters({ year_min: '2020', year_max: '2010' })
    assert.equal(filters.yearMin, 2010)
    assert.equal(filters.yearMax, 2020)
  })

  test('back to a clean query string (defaults omitted)', ({ assert }) => {
    assert.deepEqual(filtersToQuery(parseSetFilters({ q: 'falcon', type: 'set', page: '2' })), {
      q: 'falcon',
    })
    assert.deepEqual(filtersToQuery(parseSetFilters({ type: 'book', year_min: '2000' })), {
      year_min: '2000',
      type: 'book',
    })
  })
})

test.group('Catalogue: URLs', () => {
  test('set URLs use the set number and the slug', ({ assert }) => {
    assert.equal(
      setPath({ setNum: '75192-1', slug: 'millennium-falcon' }),
      '/sets/75192-1-millennium-falcon'
    )
    assert.equal(
      setPath({ setNum: 'WIZARD-CARDS-1', slug: 'wizard-cards' }),
      '/sets/wizard-cards-1-wizard-cards'
    )
  })

  test('every prefix of the URL parameter is a candidate set number', ({ assert }) => {
    assert.deepEqual(setNumCandidates('75192-1-millennium-falcon'), [
      '75192',
      '75192-1',
      '75192-1-millennium',
      '75192-1-millennium-falcon',
    ])
  })
})

test.group('Catalogue: themes tree', () => {
  const tree = new ThemeTree([
    { id: 158, name: 'Star Wars', slug: 'star-wars', parentId: null },
    { id: 171, name: 'Ultimate Collector Series', slug: 'ucs', parentId: 158 },
    { id: 900, name: 'Mini', slug: 'mini', parentId: 171 },
    { id: 1, name: 'Technic', slug: 'technic', parentId: null },
  ])

  test('finds descendants and ancestors', ({ assert }) => {
    assert.sameMembers(tree.descendantIds(158), [158, 171, 900])
    assert.deepEqual(
      tree.ancestorsOf(900).map((theme) => theme.slug),
      ['star-wars', 'ucs', 'mini']
    )
  })

  test('lists themes with sets as indented options', ({ assert }) => {
    const counts = new Map([
      [158, 3],
      [171, 3],
      [900, 0],
      [1, 2],
    ])
    assert.deepEqual(tree.options(counts), [
      { slug: 'star-wars', name: 'Star Wars', depth: 0 },
      { slug: 'ucs', name: 'Ultimate Collector Series', depth: 1 },
      { slug: 'technic', name: 'Technic', depth: 0 },
    ])
  })
})
