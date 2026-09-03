import type { AdminProduct } from '@domain/entities/AdminProduct'
import type { AdminProductRepository } from '@application/ports/AdminProductRepository'

export class ListAdminProductsUseCase {
  private readonly repository: AdminProductRepository

  constructor(repository: AdminProductRepository) {
    this.repository = repository
  }

  async execute(): Promise<AdminProduct[]> {
    return await this.repository.list()
  }
}
