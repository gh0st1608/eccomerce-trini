import type { AdminProduct, CreateAdminProductInput } from '@domain/entities/AdminProduct'
import type { AdminProductRepository } from '@application/ports/AdminProductRepository'

export class CreateAdminProductUseCase {
  private readonly repository: AdminProductRepository

  constructor(repository: AdminProductRepository) {
    this.repository = repository
  }

  async execute(payload: CreateAdminProductInput): Promise<AdminProduct> {
    return await this.repository.create(payload)
  }
}
