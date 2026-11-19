import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import { keepLocked } from '#services/catalogue/locked_fields'

export type ImportStats = {
  /** rows read from the CSV */
  read: number
  created: number
  updated: number
  /** already up to date */
  unchanged: number
  /** rows removed because they are no longer in the dump (links only) */
  deleted: number
  /** valid rows we chose not to import (e.g. unknown theme) */
  skipped: number
  /** invalid rows */
  errors: number
}

export function emptyStats(): ImportStats {
  return { read: 0, created: 0, updated: 0, unchanged: 0, deleted: 0, skipped: 0, errors: 0 }
}

export function nowForSql() {
  return DateTime.utc().toSQL({ includeOffset: false })
}

/**
 * Compares a batch with what is stored, then writes only new and changed
 * rows with a single INSERT … ON DUPLICATE KEY UPDATE. Columns that are not
 * listed (e.g. Brickset data) are never touched, nor the columns corrected
 * by hand when the table has `locked_fields` (`lockable`).
 */
export async function upsertBatch<Row extends Record<string, string | number | null>>(options: {
  table: string
  key: keyof Row & string
  columns: readonly (keyof Row & string)[]
  rows: Row[]
  stats: ImportStats
  lockable?: boolean
}) {
  const { table, key, columns, rows, stats, lockable = false } = options

  // A key listed twice in the same batch: keep the last one
  const unique = [...new Map(rows.map((row) => [row[key], row])).values()]

  const stored: Row[] = await db
    .from(table)
    .whereIn(
      key,
      unique.map((row) => row[key] as string)
    )
    .select(key, ...columns, ...(lockable ? ['locked_fields'] : []))
  const storedByKey = new Map(stored.map((row) => [row[key], row]))

  const withLocks = unique.map((row) => {
    const current = storedByKey.get(row[key])
    return current && lockable ? keepLocked(row, current, columns) : row
  })

  const toWrite = withLocks.filter((row) => {
    const current = storedByKey.get(row[key])
    if (!current) {
      stats.created++
      return true
    }
    const changed = columns.some((column) => current[column] !== row[column])
    if (changed) {
      stats.updated++
    } else {
      stats.unchanged++
    }
    return changed
  })

  if (toWrite.length === 0) {
    return
  }

  const now = nowForSql()
  await db
    .knexQuery()
    .table(table)
    .insert(toWrite.map((row) => ({ ...row, created_at: now, updated_at: now })))
    .onConflict(key)
    .merge([...columns])
}

/**
 * Updates the same columns on many rows, `batchSize` rows per query:
 * UPDATE t SET col = CASE id WHEN … THEN … END … WHERE id IN (…)
 * Portable between MySQL and MariaDB.
 */
export async function updateById(
  table: string,
  columns: readonly string[],
  updates: { id: number; values: Record<string, string | number | null> }[],
  batchSize = 500
) {
  for (let index = 0; index < updates.length; index += batchSize) {
    const batch = updates.slice(index, index + batchSize)
    const bindings: (string | number | null)[] = []

    const assignments = columns.map((column) => {
      const cases = batch.map((update) => {
        bindings.push(update.id, update.values[column])
        return 'WHEN ? THEN ?'
      })
      return `\`${column}\` = CASE \`id\` ${cases.join(' ')} ELSE \`${column}\` END`
    })
    bindings.push(...batch.map((update) => update.id))

    await db.rawQuery(
      `UPDATE \`${table}\` SET ${assignments.join(', ')} WHERE \`id\` IN (${batch.map(() => '?').join(', ')})`,
      bindings
    )
  }
}
