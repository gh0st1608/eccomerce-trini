import type { AdminCategory, UpdateAdminCategoryInput } from '@domain/entities/AdminCategory'
import type { AdminCategoryRepository } from '@application/ports/AdminCategoryRepository'

export class UpdateAdminCategoryUseCase {
  private readonly repository: AdminCategoryRepository

  constructor(repository: AdminCategoryRepository) {
    this.repository = repository
  }

  async execute(payload: UpdateAdminCategoryInput): Promise<AdminCategory> {
    return await this.repository.update(payload)
  }
}
