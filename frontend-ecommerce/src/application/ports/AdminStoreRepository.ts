import type {
  AdminStore,
  CreateAdminStoreInput,
  UpdateAdminStoreInput,
} from '@domain/entities/AdminStore'

export interface AdminStoreRepository {
  list(): Promise<AdminStore[]>
  create(payload: CreateAdminStoreInput): Promise<AdminStore>
  update(payload: UpdateAdminStoreInput): Promise<AdminStore>
}
