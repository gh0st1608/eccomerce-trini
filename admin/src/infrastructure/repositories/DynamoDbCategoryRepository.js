import { randomUUID } from 'node:crypto';
import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Category } from '../../domain/entities/Category.js';
import { CategoryRepositoryPort } from '../../application/ports/CategoryRepositoryPort.js';

export class DynamoDbCategoryRepository extends CategoryRepositoryPort {
  constructor({ documentClient, tableName }) {
    super();
    this.documentClient = documentClient;
    this.tableName = tableName;
  }

  async list() {
    const { Items = [] } = await this.documentClient.send(
      new ScanCommand({ TableName: this.tableName }),
    );
    return Items.map((item) => new Category(item));
  }

  async findById(id) {
    const { Item } = await this.documentClient.send(
      new GetCommand({ TableName: this.tableName, Key: { id } }),
    );
    return Item ? new Category(Item) : null;
  }

  // Small catalog: a Scan + filter is simpler and cheap enough than maintaining a GSI.
  async findBySlug(slug) {
    const normalizedSlug = slug.trim().toLowerCase();
    const { Items = [] } = await this.documentClient.send(
      new ScanCommand({ TableName: this.tableName }),
    );
    const match = Items.find((item) => String(item.slug ?? '').toLowerCase() === normalizedSlug);
    return match ? new Category(match) : null;
  }

  async create(category) {
    const newCategory = {
      id: randomUUID(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      active: category.active,
      parentId: category.parentId,
      imageUrl: category.imageUrl,
    };

    await this.documentClient.send(
      new PutCommand({ TableName: this.tableName, Item: newCategory }),
    );
    return new Category(newCategory);
  }

  async update(id, category) {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const updatedCategory = {
      id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      active: category.active,
      parentId: category.parentId,
      imageUrl: category.imageUrl,
    };

    await this.documentClient.send(
      new PutCommand({ TableName: this.tableName, Item: updatedCategory }),
    );
    return new Category(updatedCategory);
  }
}
