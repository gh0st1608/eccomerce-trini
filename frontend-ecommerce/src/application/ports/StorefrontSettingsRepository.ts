import type { StorefrontSettings } from '@domain/entities/StorefrontSettings'

export interface StorefrontSettingsRepository {
  get(): Promise<StorefrontSettings>
  update(settings: StorefrontSettings): Promise<StorefrontSettings>
}