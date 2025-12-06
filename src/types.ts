import { HttpContext } from '@adonisjs/core/http'

export interface UserResolver {
  resolve(ctx: HttpContext): Promise<{ id: string; type: string } | null>
}

/**
 * Interface for resolving the tenant ID from the HTTP context.
 * Implement this to capture multitenancy information in audit records.
 */
export interface TenantResolver {
  resolve(ctx: HttpContext): Promise<{ id: number | string } | null>
}

export interface Resolver {
  resolve(ctx: HttpContext): Promise<unknown>
}

export interface AuditingConfig {
  userResolver: () => Promise<{ default: new () => UserResolver }>
  /**
   * Optional tenant resolver for multitenancy support.
   * When configured, the resolved tenant ID is stored in the tenant_id column.
   */
  tenantResolver?: () => Promise<{ default: new () => TenantResolver }>
  resolvers: Record<string, () => Promise<{ default: new () => Resolver }>>
  /**
   * When true, update events will store full snapshots (all attributes) in oldValues/newValues.
   * When false (default), only the changed attributes are stored for updates.
   */
  fullSnapshotOnUpdate?: boolean
  /**
   * List of attribute names to ignore when computing changed fields on updates
   * (e.g. timestamps or derived columns like updatedAt)
   */
  ignoredFieldsOnUpdate?: string[]
  /**
   * List of attribute names that should be masked in audit payloads (oldValues/newValues)
   * The stored value will be the string '******'.
   */
  hiddenFields?: string[]
}

export interface ResolvedAuditingConfig {
  userResolver: UserResolver
  tenantResolver: TenantResolver | null
  resolvers: Record<string, Resolver>
  fullSnapshotOnUpdate: boolean
  ignoredFieldsOnUpdate: string[]
  hiddenFields: string[]
}

export interface AuditingService {
  getUserForContext(): Promise<{ id: string; type: string } | null>
  getTenantIdForContext(): Promise<number | string | null>
  getMetadataForContext(): Promise<Record<string, unknown>>
  isFullSnapshotOnUpdate(): boolean
  getIgnoredFieldsOnUpdate(): string[]
  getHiddenFields(): string[]
}
