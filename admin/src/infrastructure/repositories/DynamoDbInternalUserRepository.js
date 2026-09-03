import { randomUUID } from 'node:crypto';
import { PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { InternalUser } from '../../domain/entities/InternalUser.js';
import { InternalUserRepositoryPort } from '../../application/ports/InternalUserRepositoryPort.js';

export class DynamoDbInternalUserRepository extends InternalUserRepositoryPort {
  constructor({ documentClient, tableName }) {
    super();
    this.documentClient = documentClient;
    this.tableName = tableName;
  }

  async list() {
    const { Items = [] } = await this.documentClient.send(new ScanCommand({ TableName: this.tableName }));
    return Items.map((item) => new InternalUser(item));
  }

  async create(user) {
    const newRecord = {
      id: randomUUID(),
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
    };

    await this.documentClient.send(new PutCommand({ TableName: this.tableName, Item: newRecord }));
    return new InternalUser(newRecord);
  }
}
