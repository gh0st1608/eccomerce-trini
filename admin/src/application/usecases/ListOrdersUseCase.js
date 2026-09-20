export class ListOrdersUseCase {
  constructor({ orderRepository }) {
    this.orderRepository = orderRepository;
  }

  async execute() {
    const orders = await this.orderRepository.list();
    return orders.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
}