import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import {
  availabilityStatus,
  bricksetColumns,
  htmlToText,
  setNumOf,
  toDate,
} from '#services/brickset/set_data'
import { fallbackDescription } from '#services/set_description'

const today = DateTime.fromISO('2026-11-16', { zone: 'utc' })
const status = (set: {
  year: number | null
  dateFirstAvailable?: string | null
  dateLastAvailable?: string | null
}) =>
  availabilityStatus(
    {
      year: set.year,
      dateFirstAvailable: set.dateFirstAvailable ?? null,
      dateLastAvailable: set.dateLastAvailable ?? null,
    },
    today
  )

test.group('Brickset: availability rule', () => {
  test('a known exit date decides', ({ assert }) => {
    assert.equal(status({ year: 2017, dateLastAvailable: '2026-12-31' }), 'available')
    assert.equal(status({ year: 2025, dateLastAvailable: '2026-11-16' }), 'available')
    assert.equal(status({ year: 2025, dateLastAvailable: '2026-11-15' }), 'retired')
  })

  test('without exit date, older than 3 years means retired', ({ assert }) => {
    assert.equal(status({ year: 1994 }), 'retired')
    assert.equal(status({ year: 2023, dateFirstAvailable: '2023-11-15' }), 'retired')
    assert.equal(status({ year: 2022 }), 'retired')
  })

  test('without exit date, a recently released set is available', ({ assert }) => {
    assert.equal(status({ year: 2026, dateFirstAvailable: '2026-03-01' }), 'available')
    assert.equal(status({ year: 2023, dateFirstAvailable: '2023-11-17' }), 'available')
  })

  test('otherwise the status is unknown', ({ assert }) => {
    assert.equal(status({ year: 2025 }), 'unknown') // recent, no Brickset data
    assert.equal(status({ year: 2027, dateFirstAvailable: '2027-01-01' }), 'unknown') // not released yet
    assert.equal(status({ year: null }), 'unknown')
  })
})

test.group('Brickset: data mapping', () => {
  test('cleans HTML descriptions', ({ assert }) => {
    assert.equal(
      htmlToText('<p>The LEGO&reg; <b>Falcon</b> we&rsquo;ve built.</p><p>Line 1<br/>Line 2</p>'),
      'The LEGO® Falcon we’ve built.\n\nLine 1\nLine 2'
    )
    assert.equal(htmlToText('<ul><li>One</li><li>Two</li></ul>'), '• One\n\n• Two')
    assert.isNull(htmlToText('<p> </p>'))
    assert.isNull(htmlToText(undefined))
  })

  test('parses dates', ({ assert }) => {
    assert.equal(toDate('2017-10-01T00:00:00Z'), '2017-10-01')
    assert.isNull(toDate(undefined))
    assert.isNull(toDate('not a date'))
  })

  test('maps prices by country and ignores empty subthemes', ({ assert }) => {
    const columns = bricksetColumns({
      setID: 1,
      number: '10179',
      numberVariant: 1,
      name: 'UCS Millennium Falcon',
      year: 2007,
      subtheme: '{None}',
      LEGOCom: { DE: { retailPrice: 499.99 }, US: { retailPrice: 0 } },
    })
    assert.deepEqual(columns, {
      brickset_id: 1,
      rrp_eur: 499.99,
      rrp_usd: null,
      rrp_gbp: null,
      date_first_available: null,
      date_last_available: null,
      subtheme: null,
      description: null,
    })
    assert.equal(
      setNumOf({ setID: 1, number: '10179', numberVariant: 2, name: '', year: 2007 }),
      '10179-2'
    )
  })
})

test.group('Fallback description', () => {
  test('builds a French sentence from the data', ({ assert }) => {
    assert.equal(
      fallbackDescription({ themeName: 'Ninjago', year: 2021, numParts: 1234, numMinifigs: 6 }),
      'Set Ninjago de 2021 comprenant 1 234 pièces et 6 minifigures.'
    )
  })

  test('handles singulars, missing data and other kinds', ({ assert }) => {
    assert.equal(
      fallbackDescription({ themeName: 'City', year: 2020, numParts: 1, numMinifigs: 1 }),
      'Set City de 2020 comprenant 1 pièce et 1 minifigure.'
    )
    assert.equal(
      fallbackDescription({
        kind: 'gear',
        themeName: 'Key Chain',
        year: 2010,
        numParts: 0,
        numMinifigs: 0,
      }),
      'Article Key Chain de 2010.'
    )
    assert.equal(
      fallbackDescription({ kind: 'book', year: null, numParts: 0, numMinifigs: 1 }),
      'Livre comprenant 1 minifigure.'
    )
  })
})
