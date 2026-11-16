import { DateTime } from 'luxon'
import ImportRun from '#models/import_run'

type Source = ImportRun['source']

/**
 * Records an import in `import_runs`: "running" while it works, then
 * "completed" with its stats, or "failed" with the error message.
 *
 * Runs still marked "running" from a previous crash or Ctrl+C are flagged
 * as "interrupted" first.
 */
export async function trackImportRun<Stats extends Record<string, number>>(
  source: Source,
  type: string,
  task: (run: ImportRun) => Promise<Stats>
): Promise<Stats> {
  await ImportRun.query()
    .where({ source, type, status: 'running' })
    .update({ status: 'interrupted', finished_at: DateTime.utc().toSQL({ includeOffset: false }) })

  const run = await ImportRun.create({
    source,
    type,
    status: 'running',
    startedAt: DateTime.utc(),
  })

  try {
    const stats = await task(run)
    run.merge({ status: 'completed', stats, finishedAt: DateTime.utc() })
    await run.save()
    return stats
  } catch (error) {
    run.merge({
      status: 'failed',
      error: error instanceof Error ? (error.stack ?? error.message) : String(error),
      finishedAt: DateTime.utc(),
    })
    await run.save()
    throw error
  }
}
