import type { AdminCategory } from '@domain/entities/AdminCategory'

export interface CategoryRepository {
  list(): Promise<AdminCategory[]>
}
