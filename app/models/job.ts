import { JobSchema } from '#database/schema'

/**
 * Background job (data update), run by `node ace jobs:work` from cron.
 * Only one job runs at a time.
 */
export default class Job extends JobSchema {}
