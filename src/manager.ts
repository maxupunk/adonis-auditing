import { AuditingService, ResolvedAuditingConfig } from './types.js'
import { HttpContext } from '@adonisjs/core/http'
import { ApplicationService, LoggerService } from '@adonisjs/core/types'

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

  async getUserForContext(): Promise<{ id: string; type: string } | null> {
    const ctx = HttpContext.get()
    if (!ctx) {
      if (this.isWebEnvironment()) {
        this.logger.warn('Cannot get current context, did you forget to enable asyncLocalStorage?')
      }
      return null
    }

    return this.config.userResolver.resolve(ctx)
  }

  async getTenantIdForContext(): Promise<number | string | null> {
    if (!this.config.tenantResolver) {
      return null
    }

    const ctx = HttpContext.get()
    if (!ctx) {
      if (this.isWebEnvironment()) {
        this.logger.warn('Cannot get current context, did you forget to enable asyncLocalStorage?')
      }
      return null
    }

    const result = await this.config.tenantResolver.resolve(ctx)
    return result?.id ?? null
  }

  async getMetadataForContext(): Promise<Record<string, unknown>> {
    const ctx = HttpContext.get()
    if (!ctx) {
      if (this.isWebEnvironment()) {
        this.logger.warn('Cannot get current context, did you forget to enable asyncLocalStorage?')
      }
      return {}
    }

    const promiseResults = await Promise.allSettled(
      Object.entries(this.config.resolvers).map(
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
