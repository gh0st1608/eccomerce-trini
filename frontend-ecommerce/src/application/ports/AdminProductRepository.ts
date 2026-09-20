import type {
  AdminProduct,
  AdminProductOptions,
  CreateAdminProductInput,
  UpdateAdminProductInput,
} from '@domain/entities/AdminProduct'

export interface AdminProductRepository {
  list(): Promise<AdminProduct[]>
  getOptions(): Promise<AdminProductOptions>
  create(payload: CreateAdminProductInput): Promise<AdminProduct>
  update(payload: UpdateAdminProductInput): Promise<AdminProduct>
  delete(id: string): Promise<void>
}
