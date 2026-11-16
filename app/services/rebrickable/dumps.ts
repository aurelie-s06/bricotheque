import { createWriteStream } from 'node:fs'
import { mkdir, rename, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { ReadableStream as WebReadableStream } from 'node:stream/web'

/**
 * Rebrickable publishes its whole database as gzipped CSV files.
 * https://rebrickable.com/downloads/
 */
export const REBRICKABLE_DUMPS_URL = 'https://cdn.rebrickable.com/media/downloads'

export type RebrickableDump = 'themes' | 'sets' | 'minifigs' | 'inventories' | 'inventory_minifigs'

export function dumpPath(directory: string, dump: RebrickableDump) {
  return join(directory, `${dump}.csv.gz`)
}

export async function dumpExists(directory: string, dump: RebrickableDump) {
  try {
    const info = await stat(dumpPath(directory, dump))
    return info.size > 0
  } catch {
    return false
  }
}

/**
 * Downloads a dump to `<directory>/<dump>.csv.gz`. The file is streamed to
 * disk under a temporary name and renamed once complete, so an interrupted
 * download never leaves a truncated file behind.
 */
export async function downloadDump(directory: string, dump: RebrickableDump) {
  await mkdir(directory, { recursive: true })

  const destination = dumpPath(directory, dump)
  const partial = `${destination}.part`
  const url = `${REBRICKABLE_DUMPS_URL}/${dump}.csv.gz`

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Briquotheque-importer' },
    signal: AbortSignal.timeout(10 * 60 * 1000),
  })
  if (!response.ok || !response.body) {
    throw new Error(`Téléchargement impossible de ${url} (HTTP ${response.status})`)
  }

  try {
    await pipeline(
      Readable.fromWeb(response.body as WebReadableStream<Uint8Array>),
      createWriteStream(partial)
    )
    await rename(partial, destination)
  } catch (error) {
    await rm(partial, { force: true })
    throw error
  }

  return destination
}
