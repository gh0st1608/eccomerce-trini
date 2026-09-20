export class CreateOrderUseCase {
  constructor({ orderRepository }) {
    this.orderRepository = orderRepository;
  }

  async execute(payload) {
    return this.orderRepository.create({
      ...payload,
      status: 'active',
      paymentStatus: 'pending',
      source: 'api',
    });
  }
}