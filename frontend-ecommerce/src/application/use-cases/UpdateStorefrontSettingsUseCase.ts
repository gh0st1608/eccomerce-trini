import type { StorefrontSettingsRepository } from '@application/ports/StorefrontSettingsRepository'
import type { StorefrontSettings } from '@domain/entities/StorefrontSettings'

export class UpdateStorefrontSettingsUseCase {
  constructor(privateRepository: StorefrontSettingsRepository) {
    this.repository = privateRepository
  }

  private readonly repository: StorefrontSettingsRepository

  async execute(settings: StorefrontSettings) {
    return await this.repository.update(settings)
  }
}