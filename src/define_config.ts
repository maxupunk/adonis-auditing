import { configProvider } from '@adonisjs/core'
import type { ConfigProvider } from '@adonisjs/core/types'
import type { AuditingConfig, ResolvedAuditingConfig } from './types.js'

export function defineConfig(config: AuditingConfig): ConfigProvider<ResolvedAuditingConfig> {
  return configProvider.create(async (_app) => {
    const userResolver = await config.userResolver()

    // Resolve tenant resolver if configured
    let tenantResolver = null
    if (config.tenantResolver) {
      const tenantResolverModule = await config.tenantResolver()
      tenantResolver = new tenantResolverModule.default()
    }

    const rawResolvers = config.resolvers ?? {}
    const resolversMap = await Promise.all(
      Object.entries(rawResolvers).map(async ([key, value]) => {
        const resolver = await value()
        return [key, new resolver.default()] as const
      })
    )
    return {
      userResolver: new userResolver.default(),
      tenantResolver,
      resolvers: Object.fromEntries(resolversMap),
      fullSnapshotOnUpdate: config.fullSnapshotOnUpdate ?? false,
      ignoredFieldsOnUpdate: config.ignoredFieldsOnUpdate ?? [],
      hiddenFields: config.hiddenFields ?? [],
    }
  })
}
