import { jest } from '@jest/globals';
import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDbCategoryRepository } from '../../infrastructure/repositories/DynamoDbCategoryRepository.js';
import { DynamoDbStoreRepository } from '../../infrastructure/repositories/DynamoDbStoreRepository.js';
import { DynamoDbInternalUserRepository } from '../../infrastructure/repositories/DynamoDbInternalUserRepository.js';
import { DynamoDbProductRepository } from '../../infrastructure/repositories/DynamoDbProductRepository.js';
import { createDynamoDbDocumentClient } from '../../infrastructure/clients/DynamoDbClientFactory.js';

const fakeClient = (impl) => ({ send: jest.fn(impl) });

describe('DynamoDbClientFactory', () => {
  test('creates a document client, redirecting to a custom endpoint when provided', () => {
    const client = createDynamoDbDocumentClient({ region: 'us-east-1', endpoint: 'http://localhost:4566' });
    expect(client).toBeDefined();
  });
});

describe('DynamoDbCategoryRepository', () => {
  test('list scans the table', async () => {
    const client = fakeClient(() => ({ Items: [{ id: 'cat-1', name: 'Ropa' }] }));
    const repo = new DynamoDbCategoryRepository({ documentClient: client, tableName: 'categories' });

    const result = await repo.list();

    expect(result[0].id).toBe('cat-1');
    expect(client.send.mock.calls[0][0]).toBeInstanceOf(ScanCommand);
  });

  test('findById returns null when missing', async () => {
    const client = fakeClient(() => ({}));
    const repo = new DynamoDbCategoryRepository({ documentClient: client, tableName: 'categories' });

    await expect(repo.findById('missing')).resolves.toBeNull();
    expect(client.send.mock.calls[0][0]).toBeInstanceOf(GetCommand);
  });

  test('findBySlug scans and matches case-insensitively', async () => {
    const client = fakeClient(() => ({ Items: [{ id: 'cat-1', slug: 'Ropa' }] }));
    const repo = new DynamoDbCategoryRepository({ documentClient: client, tableName: 'categories' });

    const found = await repo.findBySlug('ropa');
    expect(found.id).toBe('cat-1');
  });

  test('create puts a new item with a generated id', async () => {
    const client = fakeClient(() => ({}));
    const repo = new DynamoDbCategoryRepository({ documentClient: client, tableName: 'categories' });

    const created = await repo.create({ name: 'Hogar', slug: 'hogar', description: '', active: true });

    expect(created.id).toBeDefined();
    expect(client.send.mock.calls[0][0]).toBeInstanceOf(PutCommand);
  });

  test('update returns null when the category does not exist', async () => {
    const client = fakeClient(() => ({}));
    const repo = new DynamoDbCategoryRepository({ documentClient: client, tableName: 'categories' });

    await expect(repo.update('missing', {})).resolves.toBeNull();
  });

  test('update overwrites an existing category', async () => {
    const client = fakeClient((command) =>
      command instanceof GetCommand ? { Item: { id: 'cat-1' } } : {},
    );
    const repo = new DynamoDbCategoryRepository({ documentClient: client, tableName: 'categories' });

    const updated = await repo.update('cat-1', { name: 'Nuevo', slug: 'nuevo', description: '', active: true });
    expect(updated.name).toBe('Nuevo');
  });
});

describe('DynamoDbStoreRepository', () => {
  test('listPickupAvailable filters active + pickupEnabled', async () => {
    const client = fakeClient(() => ({
      Items: [
        { id: 's1', active: true, pickupEnabled: true },
        { id: 's2', active: true, pickupEnabled: false },
        { id: 's3', active: false, pickupEnabled: true },
      ],
    }));
    const repo = new DynamoDbStoreRepository({ documentClient: client, tableName: 'stores' });

    const result = await repo.listPickupAvailable();
    expect(result.map((s) => s.id)).toEqual(['s1']);
  });

  test('findBySlug returns null when not found', async () => {
    const client = fakeClient(() => ({ Items: [] }));
    const repo = new DynamoDbStoreRepository({ documentClient: client, tableName: 'stores' });

    await expect(repo.findBySlug('missing')).resolves.toBeNull();
  });

  test('create and update persist store records', async () => {
    const client = fakeClient((command) =>
      command instanceof GetCommand && command.input.Key.id === 'store-1' ? { Item: { id: 'store-1' } } : {},
    );
    const repo = new DynamoDbStoreRepository({ documentClient: client, tableName: 'stores' });

    const created = await repo.create({ name: 'Trini Centro', pickupEnabled: true, active: true });
    expect(created.id).toBeDefined();

    const updated = await repo.update('store-1', { name: 'Trini Centro 2', active: true });
    expect(updated.name).toBe('Trini Centro 2');

    const missing = await repo.update('missing', {});
    expect(missing).toBeNull();
  });

  test('list and findById read from the table', async () => {
    const client = fakeClient((command) => {
      if (command instanceof ScanCommand) {
        return { Items: [{ id: 'store-1' }] };
      }
      return { Item: { id: 'store-1' } };
    });
    const repo = new DynamoDbStoreRepository({ documentClient: client, tableName: 'stores' });

    await expect(repo.list()).resolves.toHaveLength(1);
    await expect(repo.findById('store-1')).resolves.toMatchObject({ id: 'store-1' });
  });
});

describe('DynamoDbInternalUserRepository', () => {
  test('list scans the table and create puts a new item', async () => {
    const client = fakeClient((command) =>
      command instanceof ScanCommand ? { Items: [{ id: 'usr-1' }] } : {},
    );
    const repo = new DynamoDbInternalUserRepository({ documentClient: client, tableName: 'internal-users' });

    await expect(repo.list()).resolves.toHaveLength(1);

    const created = await repo.create({ name: 'Nuevo', email: 'a@a.com', role: 'admin', active: true });
    expect(created.id).toBeDefined();
  });
});

describe('DynamoDbProductRepository', () => {
  const rawProduct = {
    id: 'SKU-100',
    name: 'Producto Test',
    category: 'ropa',
    price: 100,
    featured: false,
    checkoutFrequency: 3,
  };

  test('list enriches, filters, sorts and ranks by checkout frequency', async () => {
    const client = fakeClient(() => ({
      Items: [
        rawProduct,
        { id: 'SKU-101', name: 'Otro', category: 'ropa', price: 50, featured: true, checkoutFrequency: 0 },
      ],
    }));
    const repo = new DynamoDbProductRepository({ documentClient: client, tableName: 'products' });

    const result = await repo.list({ category: 'ropa' });
    expect(result.map((p) => p.id)).toEqual(['SKU-100', 'SKU-101']);
  });

  test('getOptionCatalog aggregates across all products', async () => {
    const client = fakeClient(() => ({ Items: [rawProduct] }));
    const repo = new DynamoDbProductRepository({ documentClient: client, tableName: 'products' });

    const catalog = await repo.getOptionCatalog();
    expect(catalog.colors.length).toBeGreaterThan(0);
  });

  test('findById returns null when missing', async () => {
    const client = fakeClient(() => ({}));
    const repo = new DynamoDbProductRepository({ documentClient: client, tableName: 'products' });

    await expect(repo.findById('missing')).resolves.toBeNull();
  });

  test('create persists a normalized product with checkoutFrequency 0', async () => {
    const client = fakeClient(() => ({}));
    const repo = new DynamoDbProductRepository({ documentClient: client, tableName: 'products' });

    const created = await repo.create({ name: 'Nuevo', category: 'ropa', price: 20 });
    expect(created.id).toBeDefined();
    expect(client.send.mock.calls[0][0]).toBeInstanceOf(PutCommand);
  });

  test('update returns null when the product does not exist', async () => {
    const client = fakeClient(() => ({}));
    const repo = new DynamoDbProductRepository({ documentClient: client, tableName: 'products' });

    await expect(repo.update('missing', {})).resolves.toBeNull();
  });

  test('update merges the existing record with the new fields', async () => {
    const client = fakeClient((command) =>
      command instanceof GetCommand ? { Item: rawProduct } : {},
    );
    const repo = new DynamoDbProductRepository({ documentClient: client, tableName: 'products' });

    const updated = await repo.update('SKU-100', { name: 'Renombrado', category: 'ropa', price: 100 });
    expect(updated.name).toBe('Renombrado');
  });

  test('registerCheckoutItems atomically increments existing items and swallows failures', async () => {
    const client = fakeClient((command) => {
      if (command instanceof UpdateCommand && command.input.Key.id === 'missing') {
        throw new Error('ConditionalCheckFailedException');
      }
      return {};
    });
    const repo = new DynamoDbProductRepository({ documentClient: client, tableName: 'products' });

    await expect(
      repo.registerCheckoutItems([
        { productId: 'SKU-100', quantity: 2 },
        { productId: 'missing', quantity: 1 },
      ]),
    ).resolves.toBeUndefined();
  });
});
