import { SpanStatusCode } from '@opentelemetry/api';
import { jest } from '@jest/globals';
import { NotFoundError, UnauthorizedError } from '../../domain/exceptions/index.js';
import { addDynamoDbTableAttributes } from '../../observability/telemetry/dynamodb-span-attributes.js';
import { recordSpanError, isExpectedError } from '../../observability/tracing/record-span-error.js';
import { recordSecurityEvent } from '../../observability/security/record-security-event.js';
import { countOrdersCreated } from '../../observability/metrics/business-metrics.js';
import {
  instrumentUseCase,
  instrumentUseCases,
} from '../../observability/tracing/instrument-usecase.js';

const fakeSpan = () => ({
  setAttribute: jest.fn(),
  setAttributes: jest.fn(),
  recordException: jest.fn(),
  setStatus: jest.fn(),
});

describe('Observability signals', () => {
  test('DynamoDB spans get the table for New Relic Databases', () => {
    const span = fakeSpan();
    addDynamoDbTableAttributes(span, {
      request: {
        serviceName: 'DynamoDB',
        commandName: 'GetItem',
        commandInput: { TableName: 'products' },
      },
    });
    expect(span.setAttributes).toHaveBeenCalledWith({
      'db.system': 'dynamodb',
      'db.operation': 'GetItem',
      'db.collection.name': 'products',
      'db.sql.table': 'products',
    });
  });

  test('DynamoDB batch operations list every table; other services are ignored', () => {
    const batch = fakeSpan();
    addDynamoDbTableAttributes(batch, {
      request: {
        serviceName: 'DynamoDB',
        commandName: 'BatchWriteItem',
        commandInput: { RequestItems: { products: [], orders: [] } },
      },
    });
    expect(batch.setAttributes).toHaveBeenCalledWith(
      expect.objectContaining({ 'db.collection.name': 'products,orders' }),
    );

    const s3 = fakeSpan();
    addDynamoDbTableAttributes(s3, {
      request: { serviceName: 'S3', commandInput: { Bucket: 'b' } },
    });
    expect(s3.setAttributes).not.toHaveBeenCalled();
  });

  test('expected client errors do not mark the span as ERROR', () => {
    const span = fakeSpan();
    recordSpanError(span, new NotFoundError('nope'));

    expect(span.setStatus).not.toHaveBeenCalled();
    expect(span.recordException).not.toHaveBeenCalled();
    expect(span.setAttribute).toHaveBeenCalledWith('error.expected', true);
    expect(isExpectedError(new UnauthorizedError())).toBe(true);
    expect(isExpectedError(new Error('Not allowed by CORS'))).toBe(true);
    expect(isExpectedError({ type: 'entity.too.large' })).toBe(true);
  });

  test('unexpected errors are recorded as ERROR', () => {
    const span = fakeSpan();
    const err = new Error('dynamo down');
    recordSpanError(span, err);

    expect(span.recordException).toHaveBeenCalledWith(err);
    expect(span.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
      message: 'dynamo down',
    });
    expect(() => recordSpanError(undefined, err)).not.toThrow();
  });

  test('security events are logged without credentials', () => {
    const req = {
      method: 'GET',
      path: '/api/v1/admin/orders',
      ip: '1.2.3.4',
      headers: { authorization: 'Bearer secret' },
      log: { warn: jest.fn() },
    };
    recordSecurityEvent(req, {
      category: 'authentication',
      action: 'admin_token',
      reason: 'invalid_token',
    });

    const [fields, message] = req.log.warn.mock.calls[0];
    expect(message).toBe('Security event: authentication.admin_token');
    expect(fields.event).toEqual({
      category: 'authentication',
      action: 'admin_token',
      reason: 'invalid_token',
      outcome: 'failure',
    });
    expect(JSON.stringify(fields)).not.toContain('secret');
  });

  test('order counter decorator returns the created order', async () => {
    const order = { id: 'o1', delivery: { method: 'pickup' } };
    const useCase = countOrdersCreated({ execute: jest.fn().mockResolvedValue(order) });
    await expect(useCase.execute({})).resolves.toBe(order);
  });

  test('use cases are instrumented once, named after their key', async () => {
    const inner = { execute: jest.fn().mockResolvedValue('ok') };
    const once = instrumentUseCase('ListThingsUseCase', inner);
    expect(instrumentUseCase('ListThingsUseCase', once)).toBe(once);

    const { listThingsUseCase, other } = instrumentUseCases({
      listThingsUseCase: once,
      other: inner,
    });
    expect(listThingsUseCase).toBe(once);
    await expect(other.execute(1)).resolves.toBe('ok');
    expect(inner.execute).toHaveBeenCalledWith(1);
  });

  test('instrumented use cases rethrow errors', async () => {
    const failing = instrumentUseCase('FailUseCase', {
      execute: jest.fn().mockRejectedValue(new NotFoundError('x')),
    });
    await expect(failing.execute()).rejects.toBeInstanceOf(NotFoundError);
  });
});
