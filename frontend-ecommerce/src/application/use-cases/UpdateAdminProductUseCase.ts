import type { AdminProduct, UpdateAdminProductInput } from '@domain/entities/AdminProduct'
import type { AdminProductRepository } from '@application/ports/AdminProductRepository'

export class UpdateAdminProductUseCase {
  private readonly repository: AdminProductRepository

  constructor(repository: AdminProductRepository) {
    this.repository = repository
  }

  async execute(payload: UpdateAdminProductInput): Promise<AdminProduct> {
    return await this.repository.update(payload)
  }
}
