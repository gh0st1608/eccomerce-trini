import type { AdminOrder } from '@domain/entities/AdminOrder'
import type { AdminOrderRepository } from '@application/ports/AdminOrderRepository'

export class ListAdminOrdersUseCase {
  private readonly repository: AdminOrderRepository

  constructor(repository: AdminOrderRepository) {
    this.repository = repository
  }

  async execute(): Promise<AdminOrder[]> {
    return await this.repository.list()
  }
}
