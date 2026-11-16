import { column } from '@adonisjs/lucid/orm'
import type { ColumnOptions } from '@adonisjs/lucid/types/model'

/**
 * Custom column decorators used by the generated schema classes
 * (see database/schema_rules.ts).
 */

/**
 * DECIMAL columns: MySQL returns them as strings, we expose numbers.
 */
export function decimalColumn(options: Partial<ColumnOptions> = {}) {
  return column({
    ...options,
    consume: (value: string | number | null) => (value === null ? null : Number(value)),
  })
}

/**
 * JSON columns: stored as text, exposed as plain objects.
 */
export function jsonColumn(options: Partial<ColumnOptions> = {}) {
  return column({
    ...options,
    prepare: (value: unknown) =>
      value === null || value === undefined ? null : JSON.stringify(value),
    consume: (value: unknown) => (typeof value === 'string' ? JSON.parse(value) : value),
  })
}
