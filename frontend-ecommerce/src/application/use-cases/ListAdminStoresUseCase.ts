import type { AdminStore } from '@domain/entities/AdminStore'
import type { AdminStoreRepository } from '@application/ports/AdminStoreRepository'

export class ListAdminStoresUseCase {
  private readonly repository: AdminStoreRepository

  constructor(repository: AdminStoreRepository) {
    this.repository = repository
  }

  async execute(): Promise<AdminStore[]> {
    return await this.repository.list()
  }
}
