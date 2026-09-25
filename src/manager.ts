import { HttpContext } from '@adonisjs/core/http'
import type { ApplicationService, LoggerService } from '@adonisjs/core/types'
import type { AuditingService, ResolvedAuditingConfig } from './types.js'

export default class AuditingManager implements AuditingService {
  constructor(
    protected config: ResolvedAuditingConfig,
    protected logger: LoggerService,
    protected app: ApplicationService
  ) {}

  /**
   * Check if the application is running in web environment.
   * Warnings are only logged in web environment to avoid noise in console/CLI commands.
   */
  protected isWebEnvironment(): boolean {
    return this.app.getEnvironment() === 'web'
  }

  /**
   * Safe access to the current HttpContext, logging a warning only in web environment if missing.
   */
  protected getContext(): HttpContext | null {
    const ctx = HttpContext.get()
    if (!ctx && this.isWebEnvironment()) {
      this.logger.warn('Cannot get current context, did you forget to enable asyncLocalStorage?')
    }
    return ctx ?? null
  }

  async getUserForContext(): Promise<{ id: string; type: string } | null> {
    const ctx = this.getContext()
    if (!ctx) {
      return null
    }

    try {
      return await this.config.userResolver.resolve(ctx)
    } catch (error) {
      this.logger.warn('Failed to resolve user for audit context', error)
      return null
    }
  }

  async getTenantIdForContext(): Promise<number | string | null> {
    if (!this.config.tenantResolver) {
      return null
    }

    const ctx = this.getContext()
    if (!ctx) {
      return null
    }

    try {
      const result = await this.config.tenantResolver.resolve(ctx)
      return result?.id ?? null
    } catch (error) {
      this.logger.warn('Failed to resolve tenant for audit context', error)
      return null
    }
  }

  async getMetadataForContext(): Promise<Record<string, unknown>> {
    const ctx = this.getContext()
    if (!ctx) {
      return {}
    }

    const resolvers = this.config.resolvers ?? {}
    const promiseResults = await Promise.allSettled(
      Object.entries(resolvers).map(
        async ([key, resolver]) => [key, await resolver.resolve(ctx)] as const
      )
    )

    return Object.fromEntries(
      promiseResults
        .map((result) => {
          if (result.status === 'fulfilled') {
            return result.value
          }

          this.logger.warn('Failed to resolve auditing metadata', result.reason)
          return null
        })
        .filter((value) => value !== null) as [string, unknown][]
    )
  }

  isFullSnapshotOnUpdate(): boolean {
    return this.config.fullSnapshotOnUpdate
  }

  getIgnoredFieldsOnUpdate(): string[] {
    return this.config.ignoredFieldsOnUpdate
  }

  getHiddenFields(): string[] {
    return this.config.hiddenFields
  }
}
