import { test } from '@japa/runner'
import { decadeOf, setValue } from '#services/dashboard'

test.group('Dashboard: value of a set', () => {
  const row = (values: Partial<Parameters<typeof setValue>[0]>) => ({
    condition: null,
    rrp_eur: null,
    estimated_value_new: null,
    estimated_value_used: null,
    ...values,
  })

  test('BrickLink value first: new for sealed sets, otherwise used', ({ assert }) => {
    const prices = {
      rrp_eur: '100.00',
      estimated_value_new: '300.00',
      estimated_value_used: '180.00',
    }
    assert.deepEqual(setValue(row({ ...prices, condition: 'sealed' })), {
      value: 300,
      source: 'bricklink',
    })
    assert.deepEqual(setValue(row({ ...prices, condition: 'built' })), {
      value: 180,
      source: 'bricklink',
    })
    assert.deepEqual(setValue(row({ ...prices, estimated_value_used: null })), {
      value: 300,
      source: 'bricklink',
    })
  })

  test('then the original price, then nothing', ({ assert }) => {
    assert.deepEqual(setValue(row({ rrp_eur: '99.99' })), { value: 99.99, source: 'original' })
    assert.deepEqual(setValue(row({})), { value: null, source: 'unknown' })
  })

  test('decades', ({ assert }) => {
    assert.equal(decadeOf(1987), 1980)
    assert.equal(decadeOf(2020), 2020)
  })
})
