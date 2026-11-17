import { test } from '@japa/runner'
import { decadeOf } from '#services/dashboard'

test.group('Dashboard', () => {
  test('decades', ({ assert }) => {
    assert.equal(decadeOf(1987), 1980)
    assert.equal(decadeOf(2020), 2020)
  })
})
