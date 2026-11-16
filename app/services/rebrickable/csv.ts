import { createReadStream } from 'node:fs'
import { createGunzip } from 'node:zlib'
import { pipeline } from 'node:stream'
import { parse } from 'csv-parse'

/**
 * Streams the records of a CSV file (optionally gzipped) one by one,
 * without loading the whole file in memory.
 *
 * Throws if one of the `requiredColumns` is missing from the header, so a
 * format change on Rebrickable's side fails loudly instead of importing
 * empty values.
 */
export async function* readCsv<Columns extends string>(
  path: string,
  requiredColumns: readonly Columns[]
): AsyncGenerator<Record<Columns, string>> {
  const parser = parse({
    columns: (header: string[]) => {
      const missing = requiredColumns.filter((column) => !header.includes(column))
      if (missing.length) {
        throw new Error(`Colonnes manquantes dans ${path} : ${missing.join(', ')}`)
      }
      return header
    },
    bom: true,
    skip_empty_lines: true,
  })

  const source = createReadStream(path)
  const noop = () => {}
  if (path.endsWith('.gz')) {
    pipeline(source, createGunzip(), parser, noop)
  } else {
    pipeline(source, parser, noop)
  }

  for await (const record of parser) {
    yield record as Record<Columns, string>
  }
}
