import type { AdminOrderRepository } from '@application/ports/AdminOrderRepository'
import type { AdminOrder } from '@domain/entities/AdminOrder'

export class UpdateAdminOrderUseCase {
  private readonly repository: AdminOrderRepository

  constructor(repository: AdminOrderRepository) {
    this.repository = repository
  }

  async execute(
    id: string,
    changes: Partial<Pick<AdminOrder, 'status' | 'paymentStatus'>>,
  ): Promise<AdminOrder> {
    return await this.repository.update(id, changes)
  }
}