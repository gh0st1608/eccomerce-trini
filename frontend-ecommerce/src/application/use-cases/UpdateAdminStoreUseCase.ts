import type { AdminStore, UpdateAdminStoreInput } from '@domain/entities/AdminStore'
import type { AdminStoreRepository } from '@application/ports/AdminStoreRepository'

export class UpdateAdminStoreUseCase {
  private readonly repository: AdminStoreRepository

  constructor(repository: AdminStoreRepository) {
    this.repository = repository
  }

  async execute(payload: UpdateAdminStoreInput): Promise<AdminStore> {
    return await this.repository.update(payload)
  }
}
