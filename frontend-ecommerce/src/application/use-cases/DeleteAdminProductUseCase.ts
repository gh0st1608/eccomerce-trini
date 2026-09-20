import type { AdminProductRepository } from '@application/ports/AdminProductRepository'

export class DeleteAdminProductUseCase {
  private readonly repository: AdminProductRepository

  constructor(repository: AdminProductRepository) {
    this.repository = repository
  }

  async execute(id: string): Promise<void> {
    await this.repository.delete(id)
  }
}