import type { StorefrontSettingsRepository } from '@application/ports/StorefrontSettingsRepository'

export class GetStorefrontSettingsUseCase {
  constructor(privateRepository: StorefrontSettingsRepository) {
    this.repository = privateRepository
  }

  private readonly repository: StorefrontSettingsRepository

  async execute() {
    return await this.repository.get()
  }
}