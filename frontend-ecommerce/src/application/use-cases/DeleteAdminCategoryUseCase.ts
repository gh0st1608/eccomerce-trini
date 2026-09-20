import type { AdminCategoryRepository } from '@application/ports/AdminCategoryRepository'

export class DeleteAdminCategoryUseCase {
  private readonly repository: AdminCategoryRepository

  constructor(repository: AdminCategoryRepository) {
    this.repository = repository
  }

  async execute(id: string): Promise<void> {
    await this.repository.delete(id)
  }
}