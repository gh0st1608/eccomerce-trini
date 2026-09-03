import type { AdminCategory, CreateAdminCategoryInput } from '@domain/entities/AdminCategory'
import type { AdminCategoryRepository } from '@application/ports/AdminCategoryRepository'

export class CreateAdminCategoryUseCase {
  private readonly repository: AdminCategoryRepository

  constructor(repository: AdminCategoryRepository) {
    this.repository = repository
  }

  async execute(payload: CreateAdminCategoryInput): Promise<AdminCategory> {
    return await this.repository.create(payload)
  }
}
