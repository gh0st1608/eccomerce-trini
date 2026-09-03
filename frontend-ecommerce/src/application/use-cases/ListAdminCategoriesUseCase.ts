import type { AdminCategory } from '@domain/entities/AdminCategory'
import type { AdminCategoryRepository } from '@application/ports/AdminCategoryRepository'

export class ListAdminCategoriesUseCase {
  private readonly repository: AdminCategoryRepository

  constructor(repository: AdminCategoryRepository) {
    this.repository = repository
  }

  async execute(): Promise<AdminCategory[]> {
    return await this.repository.list()
  }
}
