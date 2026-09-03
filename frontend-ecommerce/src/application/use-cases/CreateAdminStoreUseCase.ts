import type { AdminStore, CreateAdminStoreInput } from '@domain/entities/AdminStore'
import type { AdminStoreRepository } from '@application/ports/AdminStoreRepository'

export class CreateAdminStoreUseCase {
  private readonly repository: AdminStoreRepository

  constructor(repository: AdminStoreRepository) {
    this.repository = repository
  }

  async execute(payload: CreateAdminStoreInput): Promise<AdminStore> {
    return await this.repository.create(payload)
  }
}
