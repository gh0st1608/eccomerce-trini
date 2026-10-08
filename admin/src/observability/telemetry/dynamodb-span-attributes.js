// instrumentation-aws-sdk emits only the stable DB semconv (db.system.name, db.operation.name,
// db.namespace) plus `aws.dynamodb.table_names`. New Relic's Databases page showed the
// operations but an empty "Top database operations" table, so the table is also set as
// db.collection.name / db.sql.table, together with the legacy db.system / db.operation.
const tableNamesOf = (commandInput = {}) => {
  if (commandInput.TableName) {
    return [commandInput.TableName];
  }
  // BatchGetItem / BatchWriteItem: one entry per table.
  return Object.keys(commandInput.RequestItems ?? {});
};

export const addDynamoDbTableAttributes = (span, { request }) => {
  if (request?.serviceName !== 'DynamoDB') {
    return;
  }
  const tables = tableNamesOf(request.commandInput);
  if (tables.length === 0) {
    return;
  }
  const table = tables.join(',');
  span.setAttributes({
    'db.system': 'dynamodb',
    'db.operation': request.commandName,
    'db.collection.name': table,
    'db.sql.table': table,
  });
};
