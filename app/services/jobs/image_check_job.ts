import { DateTime } from 'luxon'
import Job from '#models/job'
import SyncJob from '#services/jobs/sync_job'
import ImageHealth from '#services/admin/image_health'

/**
 * "Check all the pictures now" from the back office: a background job run
 * by `node ace jobs:work`, like the data updates (about an hour).
 */
export default class ImageCheckJob {
  static current() {
    return SyncJob.current('images')
  }

  /** Returns null when a check is already pending or running */
  static async enqueue(userId: number | null) {
    if (await this.current()) return null
    return Job.create({ type: 'images', status: 'pending', requestedBy: userId })
  }

  static async run(job: Job) {
    try {
      const stats = await ImageHealth.run({
        all: true,
        onProgress: async (progress) => {
          job.progress = {
            step: progress.checked,
            steps: progress.total,
            label: 'Images',
            message: `${progress.broken} cassée(s)`,
          }
          job.heartbeatAt = DateTime.now()
          await job.save()
        },
      })
      job.status = 'completed'
      job.progress = {
        step: stats.checked,
        steps: stats.total,
        label: 'Images',
        message: `${stats.broken} cassée(s), ${stats.unknown} sans réponse`,
      }
    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : String(error)
    }
    job.finishedAt = DateTime.now()
    await job.save()
    return job
  }
}
