/**
 * Columns corrected by hand in the back office, stored as a comma-separated
 * list in `locked_fields`. The imports never overwrite them.
 */
export function parseLocked(value: unknown): Set<string> {
  if (typeof value !== 'string' || value === '') return new Set()
  return new Set(value.split(',').filter(Boolean))
}

export function serializeLocked(fields: Iterable<string>): string | null {
  const list = [...new Set(fields)].sort()
  return list.length ? list.join(',') : null
}

/**
 * Keeps the stored value of the locked columns in a row about to be
 * written by an import.
 */
export function keepLocked<Row extends Record<string, unknown>>(
  row: Row,
  stored: Record<string, unknown> & { locked_fields?: unknown },
  columns: readonly string[]
): Row {
  const locked = parseLocked(stored.locked_fields)
  if (locked.size === 0) return row
  const kept: Record<string, unknown> = { ...row }
  for (const column of columns) {
    if (locked.has(column)) kept[column] = stored[column]
  }
  return kept as Row
}
