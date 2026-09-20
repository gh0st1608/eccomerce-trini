import { randomUUID } from 'node:crypto';
import { DeleteCommand, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Order } from '../../domain/entities/Order.js';
import { OrderRepositoryPort } from '../../application/ports/OrderRepositoryPort.js';

export class DynamoDbOrderRepository extends OrderRepositoryPort {
  constructor({ documentClient, tableName }) {
    super();
    this.documentClient = documentClient;
    this.tableName = tableName;
  }

  async list() {
    const { Items = [] } = await this.documentClient.send(new ScanCommand({ TableName: this.tableName }));
    return Items.map((item) => new Order(item));
  }

  async findById(id) {
    const { Item } = await this.documentClient.send(
      new GetCommand({ TableName: this.tableName, Key: { id } }),
    );
    return Item ? new Order(Item) : null;
  }

  async create(order) {
    const now = new Date().toISOString();
    const record = { ...order, id: randomUUID(), createdAt: now, updatedAt: now };
    await this.documentClient.send(new PutCommand({ TableName: this.tableName, Item: record }));
    return new Order(record);
  }

  async update(id, changes) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const record = { ...existing, ...changes, id, updatedAt: new Date().toISOString() };
    await this.documentClient.send(new PutCommand({ TableName: this.tableName, Item: record }));
    return new Order(record);
  }

  async delete(id) {
    await this.documentClient.send(new DeleteCommand({ TableName: this.tableName, Key: { id } }));
  }
}