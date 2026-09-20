import { NotFoundError } from '../../domain/exceptions/index.js';

export class UpdateOrderUseCase {
  constructor({ orderRepository }) {
    this.orderRepository = orderRepository;
  }

  async execute(id, changes) {
    const existing = await this.orderRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Order not found');
    }

    return this.orderRepository.update(id, changes);
  }
}