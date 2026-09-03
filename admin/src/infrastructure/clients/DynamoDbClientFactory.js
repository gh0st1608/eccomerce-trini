import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Single DynamoDB Document Client shared by every Dynamo*Repository.
// Same LocalStack/AWS switch as S3ProductImageStorageClient: endpoint set -> LocalStack.
export const createDynamoDbDocumentClient = ({ region, endpoint } = {}) => {
  const client = new DynamoDBClient({
    region,
    ...(endpoint ? { endpoint } : {}),
  });

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });
};
