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

const boolean = {
  tsType: 'boolean',
  imports: [{ ...columnTypes, namedImports: ['booleanColumn'] }],
  decorators: [{ name: '@booleanColumn' }],
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
    boolean,
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
    users: {
      columns: {
        is_admin: boolean,
      },
    },
    jobs: {
      columns: {
        type: enumOf(['sync']),
        status: enumOf(['pending', 'running', 'completed', 'failed']),
        progress: json('{ step: number; steps: number; label: string; message: string }'),
        result: json('{ newSets: string[]; newMinifigs: string[] }'),
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
