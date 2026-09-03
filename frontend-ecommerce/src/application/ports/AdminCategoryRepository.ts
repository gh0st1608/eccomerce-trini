import type {
  AdminCategory,
  CreateAdminCategoryInput,
  UpdateAdminCategoryInput,
} from '@domain/entities/AdminCategory'

export interface AdminCategoryRepository {
  list(): Promise<AdminCategory[]>
  create(payload: CreateAdminCategoryInput): Promise<AdminCategory>
  update(payload: UpdateAdminCategoryInput): Promise<AdminCategory>
}
