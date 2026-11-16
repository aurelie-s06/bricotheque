import { mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import app from '@adonisjs/core/services/app'

/**
 * Copies a fixture set (tests/fixtures/rebrickable/<name>/*.csv) into a
 * temporary directory as gzipped files, like the real Rebrickable dumps.
 */
export async function gzippedFixtures(name: string) {
  const source = app.makePath('tests/fixtures/rebrickable', name)
  const directory = await mkdtemp(join(tmpdir(), `rebrickable-${name}-`))

  for (const file of await readdir(source)) {
    if (file.endsWith('.csv') && !file.startsWith('._')) {
      const content = await readFile(join(source, file))
      await writeFile(join(directory, `${file}.gz`), gzipSync(content))
    }
  }
  return directory
}
