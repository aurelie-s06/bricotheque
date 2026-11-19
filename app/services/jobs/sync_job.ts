import { spawn } from 'node:child_process'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import Job from '#models/job'

/** Date format of the MySQL DATETIME columns (as Lucid writes them) */
const SQL_DATETIME = 'yyyy-LL-dd HH:mm:ss'

/** A job whose worker has not given any news for this long is considered dead */
const STALE_AFTER = { minutes: 10 }
const HEARTBEAT_MS = 15_000

type Step = { label: string; args: string[]; fallback?: { when: RegExp; args: string[] } }

/**
 * Steps of a data update, the same as `node ace sync:all`. Brickset first
 * resumes an interrupted import (daily quota); when there is nothing to
 * resume, it starts a new pass.
 */
const STEPS: Step[] = [
  { label: 'Rebrickable', args: ['import:rebrickable'] },
  {
    label: 'Brickset',
    args: ['import:brickset', '--resume'],
    fallback: { when: /Aucun import interrompu/, args: ['import:brickset'] },
  },
]

// eslint-disable-next-line no-control-regex
const stripAnsi = (text: string) => text.replace(/\u001b\[[0-9;]*[A-Za-z]/g, '')

/**
 * Data updates run in the background without Redis: the back office adds a
 * "pending" row to the jobs table, `node ace jobs:work` (cron, every
 * minute) takes it and runs the import commands one after the other.
 * Only one job can be pending or running at a time.
 */
export default class SyncJob {
  /** Marks as failed the running jobs whose worker gave no news for too long */
  static async cleanUp() {
    await Job.query()
      .where('status', 'running')
      .where('heartbeat_at', '<', DateTime.now().minus(STALE_AFTER).toFormat(SQL_DATETIME))
      .update({
        status: 'failed',
        error: 'Le processus de mise à jour s’est arrêté sans prévenir.',
        finishedAt: DateTime.now().toFormat(SQL_DATETIME),
      })
  }

  /** Pending or running job of this type, if any (after cleaning up dead ones) */
  static async current(type: Job['type'] = 'sync') {
    await this.cleanUp()
    return Job.query()
      .where('type', type)
      .whereIn('status', ['pending', 'running'])
      .orderBy('id')
      .first()
  }

  /** Asks for an update; returns null when one is already pending or running */
  static async enqueue(userId: number | null) {
    if (await this.current('sync')) return null
    return Job.create({ type: 'sync', status: 'pending', requestedBy: userId })
  }

  /**
   * Takes the oldest pending job (atomically) whose type is not already
   * running, or null. A data update and a picture check can run side by side.
   */
  static async claim() {
    await this.cleanUp()
    const pending = await Job.query().where('status', 'pending').orderBy('id')
    for (const job of pending) {
      const running = await Job.query().where({ type: job.type, status: 'running' }).first()
      if (running) continue
      const now = DateTime.now()
      const updated = await Job.query()
        .where({ id: job.id, status: 'pending' })
        .update({
          status: 'running',
          startedAt: now.toFormat(SQL_DATETIME),
          heartbeatAt: now.toFormat(SQL_DATETIME),
        })
      const count = Array.isArray(updated) ? Number(updated[0]) : Number(updated)
      if (count !== 1) continue
      await job.refresh()
      return job
    }
    return null
  }

  /**
   * Runs the steps; saves the progress, the new sets and minifigs, and
   * the final status. `log` receives the output of the commands.
   */
  static async run(job: Job, log: (line: string) => void = () => {}) {
    const before = await this.#maxIds()
    let lastLine = ''
    const progress = async (step: number, label: string) => {
      job.progress = { step, steps: STEPS.length, label, message: lastLine }
      job.heartbeatAt = DateTime.now()
      await job.save()
    }

    try {
      for (const [index, step] of STEPS.entries()) {
        await progress(index + 1, step.label)
        const heartbeat = setInterval(() => void progress(index + 1, step.label), HEARTBEAT_MS)
        try {
          let output = await this.#runCommand(step.args, (line) => {
            lastLine = line
            log(line)
          })
          if (step.fallback && step.fallback.when.test(output)) {
            output = await this.#runCommand(step.fallback.args, (line) => {
              lastLine = line
              log(line)
            })
          }
        } finally {
          clearInterval(heartbeat)
        }
      }

      job.result = await this.#newItems(before)
      job.status = 'completed'
      job.progress = { step: STEPS.length, steps: STEPS.length, label: '', message: '' }
    } catch (error) {
      job.status = 'failed'
      job.error = error instanceof Error ? error.message : String(error)
    }
    job.finishedAt = DateTime.now()
    await job.save()
    return job
  }

  /** Runs `node ace <args>`; rejects when the command fails */
  static #runCommand(args: string[], onLine: (line: string) => void) {
    return new Promise<string>((resolve, reject) => {
      const child = spawn(process.execPath, [app.makePath('ace.js'), ...args], {
        cwd: app.makePath(),
        env: process.env,
      })
      let output = ''
      const read = (chunk: Buffer) => {
        const text = stripAnsi(chunk.toString())
        output += text
        for (const line of text.split(/\r?\n/)) if (line.trim()) onLine(line.trim())
      }
      child.stdout.on('data', read)
      child.stderr.on('data', read)
      child.on('error', reject)
      child.on('close', (code) => {
        if (code === 0) resolve(output)
        else
          reject(
            new Error(
              `« node ace ${args.join(' ')} » a échoué (code ${code}) : ${output.trim().split('\n').slice(-3).join(' ')}`
            )
          )
      })
    })
  }

  static async #maxIds() {
    const [sets] = await db.from('sets').max('id as max')
    const [minifigs] = await db.from('minifigs').max('id as max')
    return { sets: Number(sets.max ?? 0), minifigs: Number(minifigs.max ?? 0) }
  }

  /** Sets and minifigs created by the update (ids above the previous maximum) */
  static async #newItems(before: { sets: number; minifigs: number }) {
    const sets = await db
      .from('sets')
      .where('id', '>', before.sets)
      .orderBy('id')
      .limit(200)
      .select('set_num')
    const minifigs = await db
      .from('minifigs')
      .where('id', '>', before.minifigs)
      .orderBy('id')
      .limit(200)
      .select('fig_num')
    return {
      newSets: sets.map((row) => row.set_num as string),
      newMinifigs: minifigs.map((row) => row.fig_num as string),
    }
  }
}
