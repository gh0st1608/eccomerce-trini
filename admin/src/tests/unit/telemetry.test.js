import { SpanKind } from '@opentelemetry/api';
import { jest } from '@jest/globals';
import { isHealthCheckPath } from '../../observability/telemetry/health-check-paths.js';
import { instrumentLambdaHandler } from '../../observability/telemetry/instrument-lambda-handler.js';
import { ServerSpanProcessor } from '../../observability/telemetry/server-span-processor.js';

const fakeSpan = ({ spanId, parentSpanId, kind, attributes = {} }) => ({
  kind,
  attributes,
  duration: [0, 5e6],
  spanContext: () => ({ spanId }),
  parentSpanContext: parentSpanId ? { spanId: parentSpanId } : undefined,
  setAttribute: jest.fn((key, value) => {
    attributes[key] = value;
  }),
  updateName: jest.fn(),
});

describe('Telemetry', () => {
  test('health check paths are detected with or without query string', () => {
    expect(isHealthCheckPath('/health')).toBe(true);
    expect(isHealthCheckPath('/ready?x=1')).toBe(true);
    expect(isHealthCheckPath('/live')).toBe(true);
    expect(isHealthCheckPath('/api/v1/admin/products')).toBe(false);
    expect(isHealthCheckPath()).toBe(false);
  });

  test('server span processor names the SERVER span after the matched route', async () => {
    const processor = new ServerSpanProcessor({ serviceName: 'test' });
    const server = fakeSpan({
      spanId: 'server',
      kind: SpanKind.SERVER,
      attributes: { 'http.request.method': 'GET' },
    });
    const handler = fakeSpan({
      spanId: 'handler',
      parentSpanId: 'server',
      kind: SpanKind.INTERNAL,
      attributes: { 'router.type': 'request_handler', 'http.route': '/api/v1/admin/products/:id' },
    });

    processor.onStart(server);
    processor.onStart(handler);
    processor.onEnd(handler);
    processor.onEnd(server);

    expect(server.setAttribute).toHaveBeenCalledWith('http.route', '/api/v1/admin/products/:id');
    expect(server.updateName).toHaveBeenCalledWith('GET /api/v1/admin/products/:id');
    await expect(processor.forceFlush()).resolves.toBeUndefined();
    await expect(processor.shutdown()).resolves.toBeUndefined();
  });

  test('server span processor ignores middleware spans and unknown parents', () => {
    const processor = new ServerSpanProcessor({ serviceName: 'test' });
    const server = fakeSpan({ spanId: 'server', kind: SpanKind.SERVER });
    processor.onStart(server);
    processor.onEnd(
      fakeSpan({
        spanId: 'mw',
        parentSpanId: 'server',
        kind: SpanKind.INTERNAL,
        attributes: { 'router.type': 'middleware', 'http.route': '/' },
      }),
    );
    processor.onEnd(
      fakeSpan({
        spanId: 'orphan',
        parentSpanId: 'other',
        kind: SpanKind.INTERNAL,
        attributes: { 'router.type': 'request_handler', 'http.route': '/x' },
      }),
    );

    expect(server.updateName).not.toHaveBeenCalled();
  });

  test('lambda wrapper flushes telemetry after each invocation', async () => {
    const forceFlush = jest.fn().mockResolvedValue();
    const handler = jest.fn().mockResolvedValue({ statusCode: 500 });
    const wrapped = instrumentLambdaHandler(handler, { forceFlush });
    const event = {
      httpMethod: 'GET',
      path: '/api/v1/admin/products',
      headers: { Traceparent: 'x' },
    };

    await expect(wrapped(event, { awsRequestId: 'req-1' })).resolves.toEqual({ statusCode: 500 });
    expect(handler).toHaveBeenCalledWith(event, { awsRequestId: 'req-1' });
    expect(forceFlush).toHaveBeenCalledTimes(1);
  });

  test('lambda wrapper flushes and rethrows when the handler fails', async () => {
    const forceFlush = jest.fn().mockResolvedValue();
    const wrapped = instrumentLambdaHandler(jest.fn().mockRejectedValue(new Error('boom')), {
      forceFlush,
    });

    await expect(
      wrapped({ requestContext: { http: { method: 'POST' } }, rawPath: '/x' }),
    ).rejects.toThrow('boom');
    expect(forceFlush).toHaveBeenCalledTimes(1);
  });

  test('lambda wrapper skips tracing for health checks', async () => {
    const forceFlush = jest.fn();
    const handler = jest.fn().mockResolvedValue({ statusCode: 200 });

    await instrumentLambdaHandler(handler, { forceFlush })({ httpMethod: 'GET', path: '/health' });
    expect(handler).toHaveBeenCalled();
    expect(forceFlush).not.toHaveBeenCalled();
  });
});
