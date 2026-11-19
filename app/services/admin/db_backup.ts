import { createWriteStream } from 'node:fs'
import { mkdir, readdir, rename, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { createGzip } from 'node:zlib'
import { once } from 'node:events'
import { DateTime } from 'luxon'
import mysql from 'mysql2/promise'
import app from '@adonisjs/core/services/app'
import env from '#start/env'

/** Backups kept (one a week: about a month); the older ones are deleted */
export const KEEP_BACKUPS = 4
/** The nightly task makes a new backup when the last one is older than this */
export const BACKUP_EVERY = { days: 6 }
/** Rows read at a time */
const BATCH = 500
const FILE_PATTERN = /^bricotheque-\d{4}-\d{2}-\d{2}-\d{4}\.sql\.gz$/

export type BackupFile = { name: string; size: number; createdAt: string }

/**
 * JSON columns come back as objects: written back as JSON text (otherwise
 * they would become "[object Object]"). Dates are strings (dateStrings),
 * binary values stay Buffers.
 */
function sqlValue(value: unknown) {
  if (value !== null && typeof value === 'object' && !Buffer.isBuffer(value)) {
    return JSON.stringify(value)
  }
  return value
}

/**
 * Weekly backup of the whole database, as a gzipped SQL file that
 * phpMyAdmin (Import) or the `mysql` command can restore. Written by the
 * application itself, so it does not depend on `mysqldump` being
 * installed on the host. Stored outside public_html, in storage/backups
 * (kept by the updates, which never ship that folder).
 */
export default class DbBackup {
  /** Folder of the backups (the tests use their own) */
  static directory: string | undefined

  static folder() {
    return this.directory ?? app.makePath('storage', 'backups')
  }

  /** Writes a new backup and deletes the old ones. Returns the new file. */
  static async run(now = DateTime.now()): Promise<BackupFile> {
    const folder = this.folder()
    await mkdir(folder, { recursive: true })
    const name = `bricotheque-${now.toFormat('yyyy-LL-dd-HHmm')}.sql.gz`
    const path = join(folder, name)
    // Written under a temporary name: a cut-off backup never looks complete
    const partial = `${path}.part`

    const connection = await mysql.createConnection({
      host: env.get('DB_HOST'),
      port: env.get('DB_PORT'),
      user: env.get('DB_USER'),
      password: env.get('DB_PASSWORD')?.release(),
      database: env.get('DB_DATABASE'),
      charset: 'utf8mb4',
      // Dates exactly as stored, numbers without rounding
      dateStrings: true,
      supportBigNumbers: true,
      bigNumberStrings: true,
    })

    const gzip = createGzip()
    const output = createWriteStream(partial, { mode: 0o600 })
    gzip.pipe(output)
    const write = async (text: string) => {
      if (!gzip.write(text)) await once(gzip, 'drain')
    }

    try {
      await write(
        [
          `-- Bricothèque: backup of ${env.get('DB_DATABASE')} (${now.toISO()})`,
          '-- Restore: phpMyAdmin › Import, or: gunzip -c FILE | mysql -u USER -p DATABASE',
          'SET NAMES utf8mb4;',
          'SET FOREIGN_KEY_CHECKS = 0;',
          "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';",
          '',
        ].join('\n')
      )

      const [tables] = await connection.query<mysql.RowDataPacket[]>(
        "SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'"
      )
      for (const row of tables) {
        const table = String(Object.values(row)[0])
        const [[create]] = await connection.query<mysql.RowDataPacket[]>(
          `SHOW CREATE TABLE \`${table}\``
        )
        await write(`\nDROP TABLE IF EXISTS \`${table}\`;\n${create['Create Table']};\n`)

        for (let offset = 0; ; offset += BATCH) {
          const [rows] = await connection.query<mysql.RowDataPacket[]>(
            `SELECT * FROM \`${table}\` ORDER BY 1 LIMIT ${BATCH} OFFSET ${offset}`
          )
          if (rows.length === 0) break
          const columns = Object.keys(rows[0]).map((column) => `\`${column}\``)
          const values = rows.map(
            (item) =>
              `(${Object.values(item)
                .map((value) => connection.escape(sqlValue(value)))
                .join(',')})`
          )
          await write(
            `INSERT INTO \`${table}\` (${columns.join(',')}) VALUES\n${values.join(',\n')};\n`
          )
          if (rows.length < BATCH) break
        }
      }
      await write('\nSET FOREIGN_KEY_CHECKS = 1;\n')
      gzip.end()
      await once(output, 'close')
      await rename(partial, path)
    } catch (error) {
      gzip.destroy()
      output.destroy()
      await rm(partial, { force: true })
      throw error
    } finally {
      await connection.end()
    }

    await this.prune()
    const info = await stat(path)
    return { name, size: info.size, createdAt: info.mtime.toISOString() }
  }

  /** Backups, newest first */
  static async list(): Promise<BackupFile[]> {
    let names: string[]
    try {
      names = await readdir(this.folder())
    } catch {
      return []
    }
    const files = await Promise.all(
      names
        .filter((name) => FILE_PATTERN.test(name))
        .map(async (name) => {
          const info = await stat(join(this.folder(), name))
          return { name, size: info.size, createdAt: info.mtime.toISOString() }
        })
    )
    return files.sort((a, b) => b.name.localeCompare(a.name))
  }

  /** True when the last backup is older than a week (or there is none) */
  static async isDue(now = DateTime.now()) {
    const [last] = await this.list()
    return !last || DateTime.fromISO(last.createdAt) < now.minus(BACKUP_EVERY)
  }

  /** Keeps the most recent backups only */
  static async prune() {
    const files = await this.list()
    for (const file of files.slice(KEEP_BACKUPS)) {
      await rm(join(this.folder(), file.name), { force: true })
    }
  }
}
