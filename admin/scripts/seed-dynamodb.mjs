// Seeds DynamoDB (LocalStack or real AWS) with the same catalog/ops data that
// InMemory*Repository used to hardcode. Reuses those exact records so there is
// a single source of truth for seed data (no duplication/drift).
import { PRODUCTS } from '../src/infrastructure/repositories/InMemoryProductRepository.js';
import { CATEGORIES } from '../src/infrastructure/repositories/InMemoryCategoryRepository.js';
import { records as STORES } from '../src/infrastructure/repositories/InMemoryStoreRepository.js';
import { records as INTERNAL_USERS } from '../src/infrastructure/repositories/InMemoryInternalUserRepository.js';
import { createDynamoDbDocumentClient } from '../src/infrastructure/clients/DynamoDbClientFactory.js';
import { normalizeProductRecord } from '../src/infrastructure/repositories/shared/productCatalogRules.js';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

const endpoint = process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566';
const region = process.env.AWS_REGION || 'us-east-1';

const tableProducts = process.env.DYNAMODB_TABLE_PRODUCTS;
const tableCategories = process.env.DYNAMODB_TABLE_CATEGORIES;
const tableStores = process.env.DYNAMODB_TABLE_STORES;
const tableInternalUsers = process.env.DYNAMODB_TABLE_INTERNAL_USERS;

for (const [name, value] of Object.entries({
  DYNAMODB_TABLE_PRODUCTS: tableProducts,
  DYNAMODB_TABLE_CATEGORIES: tableCategories,
  DYNAMODB_TABLE_STORES: tableStores,
  DYNAMODB_TABLE_INTERNAL_USERS: tableInternalUsers,
})) {
  if (!value) {
    throw new Error(`Missing env var: ${name} (run "terraform output" to get the table names)`);
  }
}

const documentClient = createDynamoDbDocumentClient({ region, endpoint });

const putAll = async (tableName, items) => {
  await Promise.all(
    items.map((item) => documentClient.send(new PutCommand({ TableName: tableName, Item: item }))),
  );
  console.log(`[seed-dynamodb] ${items.length} item(s) -> ${tableName}`);
};

await putAll(
  tableProducts,
  PRODUCTS.map((product) => ({ ...normalizeProductRecord(product), checkoutFrequency: 0 })),
);
await putAll(tableCategories, CATEGORIES);
await putAll(tableStores, STORES);
await putAll(tableInternalUsers, INTERNAL_USERS);

console.log('[seed-dynamodb] done.');
