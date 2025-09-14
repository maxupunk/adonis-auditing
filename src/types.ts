import { HttpContext } from '@adonisjs/core/http'

export interface UserResolver {
  resolve(ctx: HttpContext): Promise<{ id: string; type: string } | null>
}

export interface Resolver {
  resolve(ctx: HttpContext): Promise<unknown>
}

export interface AuditingConfig {
  userResolver: () => Promise<{ default: new () => UserResolver }>
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
  resolvers: Record<string, Resolver>
  fullSnapshotOnUpdate: boolean
  ignoredFieldsOnUpdate: string[]
  hiddenFields: string[]
}

export interface AuditingService {
  getUserForContext(): Promise<{ id: string; type: string } | null>
  getMetadataForContext(): Promise<Record<string, unknown>>
  isFullSnapshotOnUpdate(): boolean
  getIgnoredFieldsOnUpdate(): string[]
  getHiddenFields(): string[]
}
