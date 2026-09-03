import { randomUUID } from 'node:crypto';
import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Product } from '../../domain/entities/Product.js';
import { ProductRepositoryPort } from '../../application/ports/ProductRepositoryPort.js';
import {
  normalizeProductRecord,
  computeFeaturedProductIds,
  enrichProduct,
  applyFilters,
  sortProducts,
  buildOptionCatalog,
} from './shared/productCatalogRules.js';

// checkoutFrequency is persisted per item (ADD/atomic increment) instead of an in-memory
// Map, since Lambda instances are stateless/ephemeral and multiple instances can run at once.
export class DynamoDbProductRepository extends ProductRepositoryPort {
  constructor({ documentClient, tableName }) {
    super();
    this.documentClient = documentClient;
    this.tableName = tableName;
  }

  async scanNormalizedProducts() {
    const { Items = [] } = await this.documentClient.send(new ScanCommand({ TableName: this.tableName }));
    return Items.map(normalizeProductRecord);
  }

  buildFrequencyMap(products) {
    return new Map(products.map((product) => [product.id, product.checkoutFrequency ?? 0]));
  }

  async list(filters = {}) {
    const products = await this.scanNormalizedProducts();
    const frequencyByProductId = this.buildFrequencyMap(products);
    const featuredProductIds = computeFeaturedProductIds(products, frequencyByProductId);
    const enrichedProducts = products.map((product) =>
      enrichProduct(product, featuredProductIds, frequencyByProductId),
    );
    const filteredProducts = applyFilters(enrichedProducts, filters);
    const sortedProducts = sortProducts(filteredProducts);

    return sortedProducts.map((product) => new Product(product));
  }

  async getOptionCatalog() {
    const products = await this.scanNormalizedProducts();
    return buildOptionCatalog(products);
  }

  async findById(id) {
    const { Item } = await this.documentClient.send(
      new GetCommand({ TableName: this.tableName, Key: { id } }),
    );
    return Item ? new Product(normalizeProductRecord(Item)) : null;
  }

  async create(product) {
    const newProduct = {
      ...normalizeProductRecord(product),
      id: randomUUID(),
      checkoutFrequency: 0,
    };

    await this.documentClient.send(new PutCommand({ TableName: this.tableName, Item: newProduct }));
    return new Product(newProduct);
  }

  async update(id, product) {
    const { Item: existing } = await this.documentClient.send(
      new GetCommand({ TableName: this.tableName, Key: { id } }),
    );
    if (!existing) {
      return null;
    }

    const updatedRecord = {
      ...existing,
      ...normalizeProductRecord(product),
      id,
    };

    await this.documentClient.send(new PutCommand({ TableName: this.tableName, Item: updatedRecord }));
    return new Product(updatedRecord);
  }

  async registerCheckoutItems(items = []) {
    await Promise.all(
      items.map(async (item) => {
        try {
          await this.documentClient.send(
            new UpdateCommand({
              TableName: this.tableName,
              Key: { id: item.productId },
              ConditionExpression: 'attribute_exists(id)',
              UpdateExpression: 'ADD checkoutFrequency :quantity',
              ExpressionAttributeValues: { ':quantity': item.quantity },
            }),
          );
        } catch {
          // Best-effort: featured ranking is not critical to checkout success.
        }
      }),
    );
  }
}
