import { randomUUID } from 'node:crypto';
import { Order } from '../../domain/entities/Order.js';
import { OrderRepositoryPort } from '../../application/ports/OrderRepositoryPort.js';

export class InMemoryOrderRepository extends OrderRepositoryPort {
  constructor(initialOrders = []) {
    super();
    this.orders = initialOrders.map((order) => new Order(order));
  }

  async list() {
    return [...this.orders];
  }

  async findById(id) {
    return this.orders.find((order) => order.id === id) ?? null;
  }

  async create(order) {
    const now = new Date().toISOString();
    const created = new Order({ ...order, id: randomUUID(), createdAt: now, updatedAt: now });
    this.orders.push(created);
    return created;
  }

  async update(id, changes) {
    const index = this.orders.findIndex((order) => order.id === id);
    if (index < 0) return null;

    const updated = new Order({
      ...this.orders[index],
      ...changes,
      id,
      updatedAt: new Date().toISOString(),
    });
    this.orders[index] = updated;
    return updated;
  }

  async delete(id) {
    this.orders = this.orders.filter((order) => order.id !== id);
  }
}