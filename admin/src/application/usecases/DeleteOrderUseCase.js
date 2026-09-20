import { BusinessError, NotFoundError } from '../../domain/exceptions/index.js';

export class DeleteOrderUseCase {
  constructor({ orderRepository }) {
    this.orderRepository = orderRepository;
  }

  async execute(id) {
    const existing = await this.orderRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Order not found');
    }
    if (existing.status !== 'inactive') {
      throw new BusinessError('Order must be inactive before deletion');
    }

    await this.orderRepository.delete(id);
  }
}