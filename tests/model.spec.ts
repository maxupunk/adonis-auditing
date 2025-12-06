import { test } from '@japa/runner'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { resetTables, setupApp } from '../tests_helpers/helper.js'
import Audit from '../src/audit.js'

test.group('BaseModel with auditable', () => {
  test('create event', async ({ assert }) => {
    const { db } = await setupApp()
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const book = new Book()
    assert.isUndefined(book.id)
    book.name = 'The Hobbit'
    await book.save()
    assert.isDefined(book.id)

    assert.lengthOf(await book.audits(), 1)
    const audit = await book.audits().first()
    assert.isNotNull(audit)
    assert.equal(audit!.event, 'create')
    assert.equal(audit!.auditableType, 'Book')
    assert.equal(audit!.auditableId, book.id)
    assert.isNull(audit!.oldValues)
    assert.deepEqual(audit!.newValues, { id: book.id, name: 'The Hobbit' })
  })

  test('propaga tenantId para audit quando presente', async ({ assert }) => {
    const { db } = await setupApp()
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()

    class TenantScopedBook extends compose(BaseModel, Auditable) {
      static table = 'books'
      @column()
      declare id: number

      @column()
      declare name: string

      // Campo não persistido; usado apenas para copiar no audit
      declare tenantId: number
    }

    const book = new TenantScopedBook()
    book.name = 'The Hobbit'
    book.tenantId = 123
    await book.save()

    const audit = await book.audits().first()
    assert.isNotNull(audit)
    assert.equal(audit!.event, 'create')
    assert.equal(audit!.auditableType, 'TenantScopedBook')
    assert.equal(audit!.auditableId, book.id)
    assert.equal(audit!.tenantId, 123)
  })

  test('update event (diff by default)', async ({ assert }) => {
    const { db } = await setupApp()
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const book = new Book()
    assert.isUndefined(book.id)
    book.name = 'The Hobbit'
    await book.save()

    book.name = 'The Lord of the Rings'
    await book.save()
    assert.isDefined(book.id)

    assert.lengthOf(await book.audits(), 2)
    const audit = await book.audits().last()
    assert.isNotNull(audit)
    assert.equal(audit!.event, 'update')
    assert.equal(audit!.auditableType, 'Book')
    assert.equal(audit!.auditableId, book.id)
    // Expect only changed fields by default
    assert.deepEqual(audit!.newValues, { name: 'The Lord of the Rings' })
    assert.deepEqual(audit!.oldValues, { name: 'The Hobbit' })
  })

  test('delete event', async ({ assert }) => {
    const { db } = await setupApp()
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const book = new Book()
    assert.isUndefined(book.id)
    book.name = 'The Hobbit'
    await book.save()

    await book.delete()

    const audit = await Audit.query()
      .where('auditableType', 'Book')
      .where('auditableId', book.id)
      .orderBy('id', 'desc')
      .firstOrFail()

    assert.equal(audit.event, 'delete')
    assert.equal(audit.auditableType, 'Book')
    assert.equal(audit.auditableId, book.id)
    assert.deepEqual(audit.oldValues, { id: book.id, name: 'The Hobbit' })
    assert.isNull(audit.newValues)
  })

  test('do not audit failed operations', async ({ assert }) => {
    const { db } = await setupApp()
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const book = new Book()
    book.name = null!
    await assert.rejects(book.save)

    const audits = await Audit.query().where('auditableType', 'Book')
    assert.lengthOf(audits, 0)
  })

  test('events are emitted', async ({ assert }) => {
    const { db, emitter } = await setupApp()
    await resetTables(db)

    const eventStack: string[] = []
    emitter.on('audit:create', () => eventStack.push('create'))
    emitter.on('audit:update', () => eventStack.push('update'))
    emitter.on('audit:delete', () => eventStack.push('delete'))

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const book = new Book()
    book.name = 'The Hobbit'
    await book.save()

    book.name = 'The Lord of the Rings'
    await book.save()

    await book.delete()

    assert.deepEqual(eventStack, ['create', 'update', 'delete'])
  })

  test('transition to wrong types', async ({ assert }) => {
    const { db } = await setupApp()
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    class Movie extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const book = new Book()
    book.name = 'The Hobbit'
    await book.save()
    book.name = 'The Lord of the Rings'
    await book.save()

    const movie = new Movie()
    movie.name = 'The Lord of the Rings'
    await movie.save()

    const firstVersion = await movie.audits().first()
    assert.throws(() => book.transitionTo(firstVersion!, 'old'))
  })

  test('transition to wrong instance', async ({ assert }) => {
    const { db } = await setupApp()
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const bookA = new Book()
    bookA.name = 'The Hobbit'
    await bookA.save()
    bookA.name = 'The Lord of the Rings'
    await bookA.save()

    const bookB = new Book()
    bookB.name = 'Shrek'
    await bookB.save()

    const firstVersion = await bookA.audits().first()
    assert.throws(() => bookB.transitionTo(firstVersion!, 'old'))
  })

  test('transition to null attributes', async ({ assert }) => {
    const { db } = await setupApp()
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const book = new Book()
    book.name = 'The Hobbit'
    await book.save()

    const firstVersion = await book.audits().first()
    assert.throws(() => book.transitionTo(firstVersion!, 'old'))
  })

  test('transition to, audit has more attributes', async ({ assert }) => {
    const { db } = await setupApp()
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const book = new Book()
    book.name = 'The Hobbit'
    await book.save()
    book.name = 'The Lord of the Rings'
    await book.save()

    const firstVersion = await book.audits().first()
    firstVersion!.newValues!.extra = 'extra'
    assert.throws(() => book.transitionTo(firstVersion!, 'new'))
  })

  test('revert an update', async ({ assert }) => {
    const { db } = await setupApp()
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const book = new Book()
    book.name = 'The Hobbit'
    await book.save()
    book.name = 'The Lord of the Rings'
    await book.save()

    await book.revert()
    assert.equal(book.name, 'The Hobbit')
  })

  test('do not create audit when only ignored fields change', async ({ assert }) => {
    const { db } = await setupApp({ auditing: { ignoredFieldsOnUpdate: ['name'] } })
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const book = new Book()
    book.name = 'The Hobbit'
    await book.save()

    // This changes only an ignored field
    book.name = 'The Lord of the Rings'
    await book.save()

    const audits = await book.audits()
    assert.lengthOf(audits, 1)
    const last = await book.audits().last()
    assert.equal(last!.event, 'create')
  })

  test('full snapshot on update when enabled', async ({ assert }) => {
    const { db } = await setupApp({ auditing: { fullSnapshotOnUpdate: true } })
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const book = new Book()
    book.name = 'The Hobbit'
    await book.save()

    book.name = 'The Lord of the Rings'
    await book.save()

    const audit = await book.audits().last()
    assert.equal(audit!.event, 'update')
    assert.deepEqual(audit!.oldValues, { id: book.id, name: 'The Hobbit' })
    assert.deepEqual(audit!.newValues, { id: book.id, name: 'The Lord of the Rings' })
  })
  test('do not create audit when no fields changed', async ({ assert }) => {
    const { db } = await setupApp()
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const book = new Book()
    book.name = 'The Hobbit'
    await book.save()

    // Call save again without any changes
    await book.save()

    const audits = await book.audits()
    assert.lengthOf(audits, 1)
    const last = await book.audits().last()
    assert.equal(last!.event, 'create')
  })

  test('mask hiddenFields on create and delete', async ({ assert }) => {
    const { db } = await setupApp({ auditing: { hiddenFields: ['id', 'name'] } })
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const book = new Book()
    book.name = 'The Hobbit'
    await book.save()

    const createAudit = await book.audits().first()
    assert.deepEqual(createAudit!.newValues, { id: '******', name: '******' })

    await book.delete()
    const deleteAudit = await Audit.query()
      .where('auditableType', 'Book')
      .where('auditableId', book.id)
      .orderBy('id', 'desc')
      .firstOrFail()

    assert.deepEqual(deleteAudit.oldValues, { id: '******', name: '******' })
  })

  test('mask hiddenFields on update diff', async ({ assert }) => {
    const { db } = await setupApp({ auditing: { hiddenFields: ['name'] } })
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const book = new Book()
    book.name = 'The Hobbit'
    await book.save()

    book.name = 'The Lord of the Rings'
    await book.save()

    const audit = await book.audits().last()
    assert.equal(audit!.event, 'update')
    // Only changed field masked
    assert.deepEqual(audit!.oldValues, { name: '******' })
    assert.deepEqual(audit!.newValues, { name: '******' })
  })

  test('mask hiddenFields on update full snapshot', async ({ assert }) => {
    const { db } = await setupApp({
      auditing: {
        fullSnapshotOnUpdate: true,
        hiddenFields: ['name'],
      },
    })
    await resetTables(db)

    const { withAuditable } = await import('../src/auditable/factory.js')
    const Auditable = withAuditable()
    class Book extends compose(BaseModel, Auditable) {
      @column()
      declare id: number

      @column()
      declare name: string
    }

    const book = new Book()
    book.name = 'The Hobbit'
    await book.save()

    book.name = 'The Lord of the Rings'
    await book.save()

    const audit = await book.audits().last()
    assert.equal(audit!.event, 'update')
    assert.deepEqual(audit!.oldValues, { id: book.id, name: '******' })
    assert.deepEqual(audit!.newValues, { id: book.id, name: '******' })
  })
})
