import db from '@adonisjs/lucid/services/db'

/**
 * Changes each time an import finishes (the nightly update runs in another
 * process than the website): the figures kept in memory are rebuilt as
 * soon as it changes, instead of waiting for their delay.
 */
export async function catalogueVersion() {
  const [row] = await db
    .from('import_runs')
    .whereNotNull('finished_at')
    .select(db.raw('MAX(`finished_at`) AS last'), db.raw('COUNT(*) AS runs'))
  return `${row?.last ? new Date(row.last).toISOString() : ''}#${row?.runs ?? 0}`
}
