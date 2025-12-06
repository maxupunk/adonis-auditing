# General configuration

Auditing configuration is located in the `config/auditing.ts` file. By default, the file looks like this:

```typescript
import { defineConfig } from 'adonis-auditing/setup'

export default defineConfig({
  userResolver: () => import('#audit_resolvers/user_resolver'),
  resolvers: {
    ip_address: () => import('#audit_resolvers/ip_address_resolver'),
    user_agent: () => import('#audit_resolvers/user_agent_resolver'),
    url: () => import('#audit_resolvers/url_resolver'),
  },
})
```

## User resolver
User resolver, under the `userResolver` key, is a special resolver that is used to resolve the user who is responsible for the action. By default, it is set to `() => import('#audit_resolvers/user_resolver')`. You can change it to your custom resolver if needed.

## Resolvers
Resolvers, under the `resolvers` key, are used to resolve complementary metadata for the audit log. By default, there are three resolvers: `ip_address`, `user_agent`, and `url`. You can add your custom resolvers if needed. 

## Update events options

### fullSnapshotOnUpdate
When `fullSnapshotOnUpdate` is set to `true`, update events will store full snapshots of the model in `oldValues` and `newValues` (including unchanged attributes like `id`). When `false` (default), only the changed attributes are stored for update events.

Example:
```ts
import { defineConfig } from 'adonis-auditing/setup'

export default defineConfig({
  userResolver: () => import('#audit_resolvers/user_resolver'),
  resolvers: { /* ... */ },
  fullSnapshotOnUpdate: true,
})
```

Notes:
- This option does not affect create/delete events.
- Useful when you want self-contained audit entries without having to re-fetch model state for context.

### ignoredFieldsOnUpdate
Use `ignoredFieldsOnUpdate` to provide a list of attribute names that should be ignored when computing the diff for update events (e.g. timestamps like `updatedAt`). If only ignored fields change, then no audit is created for that update. If there are changes in non-ignored fields, the ignored ones will not appear in the update diff.

Example:
```ts
import { defineConfig } from 'adonis-auditing/setup'

export default defineConfig({
  userResolver: () => import('#audit_resolvers/user_resolver'),
  resolvers: { /* ... */ },
  ignoredFieldsOnUpdate: ['updatedAt', 'lastSeenAt'],
})
```

Default values:
- `fullSnapshotOnUpdate`: `false`
- `ignoredFieldsOnUpdate`: `[]`

### hiddenFields
Use `hiddenFields` to provide a list of attribute names whose values must be masked in the persisted audits. When a key is listed here, its value will be stored as the literal string "******" in `oldValues`/`newValues` for all events (create, update, delete). This helps prevent leaking sensitive information (e.g., passwords, tokens, secrets) while still preserving the audit trail structure.

Example:
```ts
import { defineConfig } from 'adonis-auditing/setup'

export default defineConfig({
  userResolver: () => import('#audit_resolvers/user_resolver'),
  resolvers: { /* ... */ },
  hiddenFields: ['password', 'token'],
})
```

Notes:
- Masking happens after diff/snapshot computation. The set of keys included in each audit entry remains the same; only values for the listed keys are replaced by "******".
- This option applies to `create`, `update` (both diff and full snapshot modes), and `delete` events.

Default values:
- `hiddenFields`: `[]`

## Multitenancy
The auditing package supports multitenancy by copying a `tenantId` property from audited model instances into the `Audit` entries when present. To make use of this feature, ensure your `audits` table includes a nullable `tenant_id` column.

Example migration:
```ts
this.schema.alterTable('audits', (table) => {
  table.integer('tenant_id').nullable()
})
```

This is especially useful in setups where models inherit from a base class (e.g. `TenantBaseModel`) or otherwise expose a `tenantId`. No extra configuration is required in the package.
