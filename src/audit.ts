import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'
import type { ModelObject } from '@adonisjs/lucid/types/model'

const jsonColumnOptions = {
  consume: (value: unknown): ModelObject | null => {
    if (!value) return null
    if (typeof value === 'object') return value as ModelObject
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as ModelObject
      } catch (e) {
        console.error('Failed to parse JSON column value:', value, e)
        return null
      }
    }
    return null
  },
  prepare: (value: unknown): string | null => (value ? JSON.stringify(value) : null),
  serialize: (value: unknown): unknown => value ?? null,
}

export default class Audit extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userType: string | null

  @column()
  declare userId: string | null

  @column()
  declare event: 'create' | 'update' | 'delete'

  @column()
  declare auditableType: string

  @column()
  declare auditableId: number | string

  @column(jsonColumnOptions)
  declare oldValues: ModelObject | null

  @column(jsonColumnOptions)
  declare newValues: ModelObject | null

  @column(jsonColumnOptions)
  declare metadata: ModelObject | null

  @column()
  declare tenantId: number | string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
