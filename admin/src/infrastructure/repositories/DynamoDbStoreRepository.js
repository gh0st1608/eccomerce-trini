import { randomUUID } from 'node:crypto';
import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Store } from '../../domain/entities/Store.js';
import { StoreRepositoryPort } from '../../application/ports/StoreRepositoryPort.js';

export class DynamoDbStoreRepository extends StoreRepositoryPort {
  constructor({ documentClient, tableName }) {
    super();
    this.documentClient = documentClient;
    this.tableName = tableName;
  }

  async list() {
    const { Items = [] } = await this.documentClient.send(new ScanCommand({ TableName: this.tableName }));
    return Items.map((item) => new Store(item));
  }

  async listPickupAvailable() {
    const { Items = [] } = await this.documentClient.send(new ScanCommand({ TableName: this.tableName }));
    return Items.filter((item) => item.active && item.pickupEnabled).map((item) => new Store(item));
  }

  async findById(id) {
    const { Item } = await this.documentClient.send(
      new GetCommand({ TableName: this.tableName, Key: { id } }),
    );
    return Item ? new Store(Item) : null;
  }

  // Small catalog: a Scan + filter is simpler and cheap enough than maintaining a GSI.
  async findBySlug(slug) {
    const { Items = [] } = await this.documentClient.send(new ScanCommand({ TableName: this.tableName }));
    const match = Items.find((item) => item.slug === slug);
    return match ? new Store(match) : null;
  }

  async create(store) {
    const newRecord = {
      id: randomUUID(),
      name: store.name,
      slug: store.slug,
      address: store.address,
      district: store.district,
      reference: store.reference,
      pickupEnabled: store.pickupEnabled,
      courierEnabled: store.courierEnabled,
      active: store.active,
    };

    await this.documentClient.send(new PutCommand({ TableName: this.tableName, Item: newRecord }));
    return new Store(newRecord);
  }

  async update(id, store) {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updatedRecord = {
      id,
      name: store.name,
      slug: store.slug,
      address: store.address,
      district: store.district,
      reference: store.reference,
      pickupEnabled: store.pickupEnabled,
      courierEnabled: store.courierEnabled,
      active: store.active,
    };

    await this.documentClient.send(new PutCommand({ TableName: this.tableName, Item: updatedRecord }));
    return new Store(updatedRecord);
  }
}
