import { type SchemaRules } from '@adonisjs/lucid/types/schema_generator'

/**
 * Rules used by Lucid to generate database/schema.ts after each migration.
 */

const columnTypes = { source: '#database/column_types', namedImports: [] as string[] }

const decimal = {
  tsType: 'number',
  imports: [{ ...columnTypes, namedImports: ['decimalColumn'] }],
  decorators: [{ name: '@decimalColumn' }],
}

const json = (tsType: string) => ({
  tsType,
  imports: [{ ...columnTypes, namedImports: ['jsonColumn'] }],
  decorators: [{ name: '@jsonColumn' }],
})

const enumOf = (values: string[]) => ({
  tsType: values.map((value) => `'${value}'`).join(' | '),
  imports: [],
  decorators: [{ name: '@column' }],
})

const collectionStatus = enumOf(['owned', 'wanted'])

export default {
  types: {
    decimal,
  },
  tables: {
    sets: {
      columns: {
        availability_status: enumOf(['available', 'retired', 'unknown']),
        kind: enumOf(['set', 'book', 'gear', 'parts', 'bundle']),
      },
    },
    user_sets: {
      columns: {
        status: collectionStatus,
        condition: enumOf(['built', 'in_box', 'sealed', 'partial']),
      },
    },
    user_minifigs: {
      columns: {
        status: collectionStatus,
      },
    },
    import_runs: {
      columns: {
        source: enumOf(['rebrickable', 'brickset', 'bricklink', 'translation']),
        status: enumOf(['running', 'completed', 'failed', 'interrupted']),
        cursor: json('Record<string, unknown>'),
        stats: json('Record<string, number>'),
      },
    },
  },
} satisfies SchemaRules
