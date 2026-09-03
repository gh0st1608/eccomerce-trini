import type { AdminOrder } from '@domain/entities/AdminOrder'

export interface AdminOrderRepository {
  list(): Promise<AdminOrder[]>
}
