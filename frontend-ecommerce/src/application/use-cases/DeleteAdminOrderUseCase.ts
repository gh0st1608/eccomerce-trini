import type { AdminOrderRepository } from '@application/ports/AdminOrderRepository'

export class DeleteAdminOrderUseCase {
  private readonly repository: AdminOrderRepository

  constructor(repository: AdminOrderRepository) {
    this.repository = repository
  }

  async execute(id: string): Promise<void> {
    await this.repository.delete(id)
  }
}