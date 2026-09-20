import type { AdminOrder } from '@domain/entities/AdminOrder'

export interface AdminOrderRepository {
  list(): Promise<AdminOrder[]>
  update(
    id: string,
    changes: Partial<Pick<AdminOrder, 'status' | 'paymentStatus'>>,
  ): Promise<AdminOrder>
  delete(id: string): Promise<void>
}
