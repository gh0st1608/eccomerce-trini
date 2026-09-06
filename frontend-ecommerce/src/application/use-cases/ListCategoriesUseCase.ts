import type { CategoryRepository } from '@application/ports/CategoryRepository'
import type { AdminCategory } from '@domain/entities/AdminCategory'

export class ListCategoriesUseCase {
  private readonly repository: CategoryRepository

  constructor(repository: CategoryRepository) {
    this.repository = repository
  }

  async execute(): Promise<AdminCategory[]> {
    return await this.repository.list()
  }
}
