import { test } from '@japa/runner'
import {
  figNumFromSearch,
  minifigFiltersToQuery,
  parseMinifigFilters,
} from '#services/catalogue/minifig_query'

test.group('Minifigs: search and filters', () => {
  test('recognises minifig numbers in several forms', ({ assert }) => {
    assert.equal(figNumFromSearch('fig-000123'), 'fig-000123')
    assert.equal(figNumFromSearch('FIG000123'), 'fig-000123')
    assert.equal(figNumFromSearch('123'), 'fig-000123')
    assert.isNull(figNumFromSearch('han solo'))
    assert.isNull(figNumFromSearch('1234567'))
  })

  test('reads the filters and ignores invalid values', ({ assert }) => {
    assert.deepEqual(
      parseMinifigFilters({
        q: ' han  solo ',
        theme: 'star-wars',
        year_min: '2020',
        year_max: '2010',
        sort: 'oldest',
        page: '2',
      }),
      { q: 'han solo', theme: 'star-wars', yearMin: 2010, yearMax: 2020, sort: 'oldest', page: 2 }
    )
    assert.deepEqual(parseMinifigFilters({ year_min: 'x', sort: 'random', page: '-1' }), {
      q: null,
      theme: null,
      yearMin: null,
      yearMax: null,
      sort: null,
      page: 1,
    })
    assert.deepEqual(minifigFiltersToQuery(parseMinifigFilters({ q: 'han', page: '3' })), {
      q: 'han',
    })
  })
})
