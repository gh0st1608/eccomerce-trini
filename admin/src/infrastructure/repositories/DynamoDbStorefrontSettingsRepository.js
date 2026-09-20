import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { StorefrontSettingsRepositoryPort } from '../../application/ports/StorefrontSettingsRepositoryPort.js';
import { StorefrontSettings } from '../../domain/entities/StorefrontSettings.js';

const SETTINGS_ID = 'storefront';

export class DynamoDbStorefrontSettingsRepository extends StorefrontSettingsRepositoryPort {
  constructor({ documentClient, tableName }) {
    super();
    this.documentClient = documentClient;
    this.tableName = tableName;
  }

  async get() {
    const { Item } = await this.documentClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id: SETTINGS_ID },
        ConsistentRead: true,
      }),
    );
    return new StorefrontSettings(Item);
  }

  async update(settings) {
    const record = { id: SETTINGS_ID, ...new StorefrontSettings(settings) };
    await this.documentClient.send(new PutCommand({ TableName: this.tableName, Item: record }));
    return new StorefrontSettings(record);
  }
}