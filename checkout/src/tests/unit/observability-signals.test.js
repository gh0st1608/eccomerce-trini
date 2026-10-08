import { SpanStatusCode } from '@opentelemetry/api';
import { jest } from '@jest/globals';
import { NotFoundError, ValidationError } from '../../domain/exceptions/index.js';
import { recordSpanError, isExpectedError } from '../../observability/tracing/record-span-error.js';
import {
  recordSecurityEvent,
  rateLimitExceededHandler,
} from '../../observability/security/record-security-event.js';
import { countCheckoutsCreated } from '../../observability/metrics/business-metrics.js';
import { errorMiddleware } from '../../infrastructure/middlewares/error.middleware.js';

const fakeSpan = () => ({
  setAttribute: jest.fn(),
  recordException: jest.fn(),
  setStatus: jest.fn(),
});

describe('Observability signals', () => {
  test('expected client errors do not mark the span as ERROR', () => {
    const span = fakeSpan();
    recordSpanError(span, new ValidationError('bad'));

    expect(span.setStatus).not.toHaveBeenCalled();
    expect(span.recordException).not.toHaveBeenCalled();
    expect(span.setAttribute).toHaveBeenCalledWith('error.expected', true);
    expect(isExpectedError(new NotFoundError())).toBe(true);
  });

  test('unexpected errors are recorded as ERROR', () => {
    const span = fakeSpan();
    const err = new Error('admin unreachable');
    recordSpanError(span, err);

    expect(span.recordException).toHaveBeenCalledWith(err);
    expect(span.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
      message: 'admin unreachable',
    });
  });

  test('CORS rejections answer 403 (not 500) and emit a security event', () => {
    const req = { context: { traceId: 't1' }, log: { warn: jest.fn(), error: jest.fn() } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    errorMiddleware(new Error('Not allowed by CORS'), req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(403);
    expect(req.log.error).not.toHaveBeenCalled();
    expect(req.log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ event: expect.objectContaining({ category: 'cors' }) }),
      'Security event: cors.origin_rejected',
    );
  });

  test('rate limit handler keeps the 429 response and logs the event', () => {
    const req = { method: 'POST', path: '/api/v1/checkout/whatsapp', log: { warn: jest.fn() } };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    rateLimitExceededHandler(req, res, () => {}, { statusCode: 429, message: 'Too many requests' });

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.send).toHaveBeenCalledWith('Too many requests');
    expect(req.log.warn.mock.calls[0][1]).toBe('Security event: rate_limit.request_throttled');
  });

  test('security events never include credentials', () => {
    const req = { headers: { authorization: 'Bearer secret' }, log: { warn: jest.fn() } };
    recordSecurityEvent(req, { category: 'cors', action: 'origin_rejected', reason: 'x' });
    expect(JSON.stringify(req.log.warn.mock.calls[0][0])).not.toContain('secret');
  });

  test('checkout counter decorator passes payload and options through', async () => {
    const inner = { execute: jest.fn().mockResolvedValue({ orderId: 'o1' }) };
    const useCase = countCheckoutsCreated(inner);
    const payload = { delivery: { method: 'courier' } };

    await expect(useCase.execute(payload, { publicBaseUrl: 'x' })).resolves.toEqual({
      orderId: 'o1',
    });
    expect(inner.execute).toHaveBeenCalledWith(payload, { publicBaseUrl: 'x' });
  });
});
