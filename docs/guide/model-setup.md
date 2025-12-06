# Model Setup

Setting up the model for auditing is a simple process.
You only need to add the `Auditable` mixin using the `compose` helper to extends the model with the auditing features.

To install the package and all its dependencies, please refer to the [Installation](/guide/installation) section.

```typescript
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { compose } from '@adonisjs/core/helpers'
import { Auditable } from 'adonis-auditing'

export default class Book extends compose(BaseModel, Auditable) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
```

## Ignored fields during updates
If your model has fields that change frequently and should not trigger an audit (like `updatedAt`), configure them in `config/auditing.ts` using `ignoredFieldsOnUpdate`. When only ignored fields change, no audit will be created for that update. When non-ignored fields change, the ignored ones are excluded from the diff.

See [General configuration > Update events options](/guide/general-configuration#update-events-options) for details.

## Multitenancy
If your model tracks multitenancy using a `tenantId` property (for example, models extending a `TenantBaseModel`), the auditing system will automatically copy `tenantId` from the model instance to the `Audit` record.

To enable this, make sure your `audits` table has a `tenant_id` column:

```ts
// migration example
this.schema.alterTable('audits', (table) => {
  table.integer('tenant_id').nullable()
})
```

Notes:
- You do not need to persist `tenantId` on the audited model for the copy to happen; a non-persisted property on the instance is sufficient.
- If you do persist `tenantId` on your model, remember to add the corresponding column on the model's table as well.
