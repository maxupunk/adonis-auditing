import { getActiveTest } from '@japa/runner'
import { join } from 'node:path'
import { Database } from '@adonisjs/lucid/database'
import { IgnitorFactory } from '@adonisjs/core/factories'
import { defineConfig as defineLucidConfig } from '@adonisjs/lucid'
import { defineConfig } from '../src/define_config.js'

import { UserResolver, TenantResolver, Resolver } from '../src/types.js'
import stringHelpers from '@adonisjs/core/helpers/string'

class FakeUserResolver implements UserResolver {
  async resolve() {
    return { id: '1', type: 'User' }
  }
}

class FakeTenantResolver implements TenantResolver {
  constructor(private tenantId: number | string | null) {}
  async resolve() {
    return this.tenantId ? { id: this.tenantId } : null
  }
}

class FooResolver implements Resolver {
  async resolve() {
    return 'bar'
  }
}

interface SetupOverrides {
  auditing?: {
    fullSnapshotOnUpdate?: boolean
    ignoredFieldsOnUpdate?: string[]
    hiddenFields?: string[]
    tenantId?: number | string | null
  }
}

export async function setupApp(overrides?: SetupOverrides) {
  const test = getActiveTest()
  if (!test) throw new Error('Cannot use "setupApp" outside of a Japa test')

  const { fs } = test.context
  // Ensure the plugin's root exists; use a relative path so it doesn't double-join on Windows
  fs.mkdir('.', { recursive: true })

  const filename = stringHelpers.slug(test.options.title)

  // Create tenantResolver factory if tenantId is provided
  const tenantResolverConfig =
    overrides?.auditing?.tenantId !== undefined
      ? async () => ({
          default: class extends FakeTenantResolver {
            constructor() {
              super(overrides!.auditing!.tenantId!)
            }
          },
        })
      : undefined

  const ignitor = new IgnitorFactory()
    .withCoreProviders()
    .withCoreConfig()
    .merge({
      config: {
        database: defineLucidConfig({
          connection: 'sqlite',
          connections: {
            sqlite: {
              client: 'better-sqlite3',
              connection: { filename: join(fs.basePath, `db-${filename}.sqlite3`), debug: true },
              useNullAsDefault: true,
            },
          },
        }),
        auditing: defineConfig({
          userResolver: async () => ({ default: FakeUserResolver }),
          tenantResolver: tenantResolverConfig,
          resolvers: {
            foo: async () => ({ default: FooResolver }),
          },
          fullSnapshotOnUpdate: overrides?.auditing?.fullSnapshotOnUpdate,
          ignoredFieldsOnUpdate: overrides?.auditing?.ignoredFieldsOnUpdate,
          hiddenFields: overrides?.auditing?.hiddenFields,
        }),
      },
      rcFileContents: {
        providers: [
          () => import('@adonisjs/lucid/database_provider'),
          () => import('../providers/auditing_provider.js'),
        ],
      },
    })
    .create(fs.baseUrl)

  const app = ignitor.createApp('web')
  test.cleanup(() => app.terminate())
  await app.init()
  await app.boot()

  const db = await app.container.make('lucid.db')
  // Use the same emitter singleton used by the auditable mixin to ensure event listeners match
  const emitter = await import('@adonisjs/core/services/emitter').then((m) => m.default)
  const auditing = await app.container.make('auditing.manager')

  return { app, db, emitter, auditing }
}

export async function resetTables(db: Database) {
  const test = getActiveTest()
  if (!test) throw new Error('Cannot use "createTables" outside of a Japa test')

  test.cleanup(async () => {
    await db.connection().schema.dropTableIfExists('users')
    await db.connection().schema.dropTableIfExists('books')
    await db.connection().schema.dropTableIfExists('movies')
    await db.connection().schema.dropTableIfExists('audits')
  })

  await db.connection().schema.createTable('users', (table) => {
    table.increments('id').notNullable()
    table.string('name').unique().notNullable()
    table.timestamps()
  })

  await db.connection().schema.createTable('books', (table) => {
    table.increments('id').notNullable()
    table.string('name').unique().notNullable()
    table.timestamps()
  })

  await db.connection().schema.createTable('movies', (table) => {
    table.increments('id').notNullable()
    table.string('name').unique().notNullable()
    table.timestamps()
  })

  await db.connection().schema.createTable('audits', (table) => {
    table.increments('id').notNullable()

    table.text('user_type').nullable()
    table.integer('user_id').nullable()

    // Multitenancy support
    table.integer('tenant_id').nullable()

    table.text('event').notNullable()

    table.text('auditable_type').notNullable()
    table.integer('auditable_id').notNullable()

    table.jsonb('old_values').nullable()
    table.jsonb('new_values').nullable()

    table.jsonb('metadata').nullable()

    table.timestamp('created_at')
    table.timestamp('updated_at')
  })
}
