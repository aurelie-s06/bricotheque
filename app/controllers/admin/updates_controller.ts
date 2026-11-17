import type { HttpContext } from '@adonisjs/core/http'
import Job from '#models/job'
import ImportRun from '#models/import_run'
import SyncJob from '#services/jobs/sync_job'
import { resolveLocale } from '#helpers/locale'
import { serverMessage } from '#helpers/server_messages'

const serializeJob = (job: Job | null) =>
  job && {
    id: job.id,
    status: job.status,
    progress: job.progress,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt.toISO(),
    startedAt: job.startedAt?.toISO() ?? null,
    finishedAt: job.finishedAt?.toISO() ?? null,
  }

/**
 * Back office: data updates. The button only queues a job; the cron worker
 * (`node ace jobs:work`) runs it, and the page refreshes its state.
 */
export default class UpdatesController {
  /** GET /admin/mises-a-jour */
  async index({ inertia }: HttpContext) {
    const current = await SyncJob.current()
    const last = current ?? (await Job.query().orderBy('id', 'desc').first())
    const runs = await ImportRun.query().orderBy('id', 'desc').limit(15)

    return inertia.render('admin/updates', {
      job: serializeJob(last),
      history: runs.map((run) => ({
        id: run.id,
        source: run.source,
        type: run.type,
        status: run.status,
        startedAt: run.startedAt.toISO(),
        finishedAt: run.finishedAt?.toISO() ?? null,
        durationSeconds: run.finishedAt
          ? Math.round(run.finishedAt.diff(run.startedAt).as('seconds'))
          : null,
        stats: run.stats,
        error: run.error ? run.error.split('\n')[0].slice(0, 300) : null,
      })),
    })
  }

  /** POST /admin/mises-a-jour */
  async store({ auth, request, session, response }: HttpContext) {
    const locale = resolveLocale(request)
    const job = await SyncJob.enqueue(auth.getUserOrFail().id)
    session.flash(
      job ? 'success' : 'error',
      serverMessage(locale, job ? 'admin.update.queued' : 'admin.update.alreadyRunning')
    )
    return response.redirect().toRoute('admin.updates')
  }
}
