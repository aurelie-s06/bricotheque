import { open, readFile, stat, truncate, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'
import BricksetClient from '#services/brickset/brickset_client'
import type { BricksetApi } from '#services/brickset/types'

export type CheckStatus = 'ok' | 'warning' | 'error'

/** Logs written by the cron tasks (see docs/deploiement-o2switch.md) */
export const LOGS = { jobs: 'jobs.log', sync: 'sync.log' } as const
export type LogName = keyof typeof LOGS

/** Lines of the cron task when nothing is to do: hidden by default */
const IDLE_LINE = /Aucun job en attente/
/** Colors of the terminal, if any */
// eslint-disable-next-line no-control-regex
const ANSI = /\u001B\[[0-9;]*m/g
/** Only the end of a log is read */
const TAIL_BYTES = 64 * 1024

const CRON_LATE_MINUTES = 15
const SYNC_LATE_HOURS = 36

/**
 * Health of the site for the back office: cron task, nightly update,
 * database, Brickset quota, emails and logs.
 */
export default class SiteHealth {
  /** Lets the tests replace the Brickset API */
  static bricksetFactory: (() => BricksetApi) | undefined

  /** Folder of the logs and of the heartbeat (the tests use their own) */
  static directory: string | undefined

  static #path(file: string) {
    return join(this.directory ?? app.makePath('tmp'), file)
  }

  static heartbeatPath() {
    return this.#path('jobs-heartbeat.txt')
  }

  static logPath(name: LogName) {
    return this.#path(LOGS[name])
  }

  static async recordHeartbeat() {
    await writeFile(this.heartbeatPath(), DateTime.utc().toISO()!)
  }

  /** Last run of `node ace jobs:work` (cron, every minute) */
  static async cron(now = DateTime.utc()) {
    let lastRun: DateTime | null = null
    try {
      const value = await readFile(this.heartbeatPath(), 'utf8')
      const parsed = DateTime.fromISO(value.trim())
      lastRun = parsed.isValid ? parsed : null
    } catch {
      lastRun = null
    }
    const minutes = lastRun ? now.diff(lastRun).as('minutes') : null
    const status: CheckStatus =
      minutes === null ? 'error' : minutes > CRON_LATE_MINUTES ? 'warning' : 'ok'
    return { status, lastRun: lastRun?.toISO() ?? null }
  }

  /** Last successful imports (nightly `sync:all`, or the button) */
  static async imports(now = DateTime.utc()) {
    const last = async (source: 'rebrickable' | 'brickset') => {
      const [row] = await db
        .from('import_runs')
        .where('source', source)
        .whereIn('status', ['completed', 'interrupted'])
        .max('finished_at as finishedAt')
      return row?.finishedAt ? DateTime.fromJSDate(new Date(row.finishedAt)) : null
    }
    const rebrickable = await last('rebrickable')
    const brickset = await last('brickset')
    const [failure] = await db
      .from('import_runs')
      .where('status', 'failed')
      .orderBy('id', 'desc')
      .limit(1)
      .select('source', 'started_at', 'error')
    // An old failure followed by a successful import of the same source is not news
    const failedAt = failure ? DateTime.fromJSDate(new Date(failure.started_at)) : null
    const succeededAt = failure?.source === 'brickset' ? brickset : rebrickable
    const lastFailure =
      failure && failedAt && (!succeededAt || failedAt > succeededAt) ? failure : null
    const late = (date: DateTime | null) => !date || now.diff(date).as('hours') > SYNC_LATE_HOURS
    const status: CheckStatus = !rebrickable
      ? 'error'
      : late(rebrickable) || late(brickset) || lastFailure
        ? 'warning'
        : 'ok'
    return {
      status,
      rebrickable: rebrickable?.toISO() ?? null,
      brickset: brickset?.toISO() ?? null,
      lastFailure: lastFailure
        ? {
            source: String(lastFailure.source),
            startedAt: new Date(lastFailure.started_at).toISOString(),
            error: String(lastFailure.error ?? '')
              .split('\n')[0]
              .slice(0, 160),
          }
        : null,
    }
  }

  /** Connection and size of the database (o2switch counts it in the quota) */
  static async database() {
    try {
      const [rows] = await db.rawQuery(
        'SELECT COALESCE(SUM(data_length + index_length), 0) AS size FROM information_schema.tables WHERE table_schema = DATABASE()'
      )
      return { status: 'ok' as CheckStatus, sizeBytes: Number(rows[0]?.size ?? 0) }
    } catch {
      return { status: 'error' as CheckStatus, sizeBytes: null }
    }
  }

  static environment() {
    return {
      node: process.version,
      mode: app.inProduction ? 'production' : app.nodeEnvironment,
      uptimeSeconds: Math.round(process.uptime()),
      bricksetKey: Boolean(env.get('BRICKSET_API_KEY')?.release()),
      mailer: String(env.get('MAIL_MAILER') ?? 'smtp'),
    }
  }

  /** Calls used today on the Brickset key (one API call, not counted in the quota) */
  static async bricksetCallsToday() {
    const api =
      this.bricksetFactory?.() ?? new BricksetClient(env.get('BRICKSET_API_KEY')?.release() ?? '')
    return {
      used: await api.getSetsCallsToday(),
      limit: env.get('BRICKSET_DAILY_LIMIT') ?? 100,
    }
  }

  /** End of a log, newest line last */
  static async readLog(name: LogName, { showIdle = false, maxLines = 200 } = {}) {
    const path = this.logPath(name)
    let size = 0
    let modifiedAt: string | null = null
    try {
      const info = await stat(path)
      size = info.size
      modifiedAt = info.mtime.toISOString()
    } catch {
      return { name, exists: false, size: 0, modifiedAt: null, lines: [], hiddenIdle: 0 }
    }

    const start = Math.max(0, size - TAIL_BYTES)
    const file = await open(path, 'r')
    let text = ''
    try {
      const buffer = Buffer.alloc(size - start)
      await file.read(buffer, 0, buffer.length, start)
      text = buffer.toString('utf8')
    } finally {
      await file.close()
    }
    let lines = text.replace(ANSI, '').split('\n')
    // The first line may be cut in the middle
    if (start > 0) lines = lines.slice(1)
    lines = lines.filter((line) => line.trim() !== '')
    const visible = showIdle ? lines : lines.filter((line) => !IDLE_LINE.test(line))
    return {
      name,
      exists: true,
      size,
      modifiedAt,
      lines: visible.slice(-maxLines),
      hiddenIdle: lines.length - visible.length,
    }
  }

  static async clearLog(name: LogName) {
    try {
      await truncate(this.logPath(name), 0)
    } catch {
      // nothing to clear
    }
  }
}
