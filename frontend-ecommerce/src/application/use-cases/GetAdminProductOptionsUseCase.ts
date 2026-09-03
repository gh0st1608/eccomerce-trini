import type { AdminProductOptions } from '@domain/entities/AdminProduct'
import type { AdminProductRepository } from '@application/ports/AdminProductRepository'

export class GetAdminProductOptionsUseCase {
  private readonly repository: AdminProductRepository

  constructor(repository: AdminProductRepository) {
    this.repository = repository
  }

  async execute(): Promise<AdminProductOptions> {
    return await this.repository.getOptions()
  }
}
