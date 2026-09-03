import { context, trace } from '@opentelemetry/api';
import { jest } from '@jest/globals';
import { BaseError } from '../../domain/exceptions/BaseError.js';
import {
  BusinessError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../domain/exceptions/index.js';
import { requestContextMiddleware } from '../../infrastructure/middlewares/request-context.middleware.js';
import { createLogger } from '../../observability/logger/create-logger.js';

describe('Domain and observability', () => {
  test('exceptions are typed', () => {
    expect(new BaseError('x', 'X', 400).code).toBe('X');
    expect(new ValidationError().statusCode).toBe(400);
    expect(new BusinessError().statusCode).toBe(400);
    expect(new NotFoundError().statusCode).toBe(404);
    expect(new UnauthorizedError().statusCode).toBe(401);
    expect(new ForbiddenError().statusCode).toBe(403);
    expect(new ConflictError().statusCode).toBe(409);
    expect(new InternalServerError().statusCode).toBe(500);
  });

  test('request context sets ids', () => {
    const req = { headers: {} };
    const res = { setHeader: jest.fn() };
    const spanContext = {
      traceId: '12345678901234567890123456789012',
      spanId: '1234567890123456',
      traceFlags: 1,
    };

    jest.spyOn(trace, 'getSpan').mockReturnValue({ spanContext: () => spanContext });

    context.with(trace.setSpan(context.active(), trace.wrapSpanContext(spanContext)), () => {
      requestContextMiddleware(req, res, () => {});
    });

    expect(req.context.traceId).toHaveLength(32);
    trace.getSpan.mockRestore();
  });

  test('logger creation', () => {
    const logger = createLogger({ appName: 'admin', environment: 'test', level: 'info' });
    expect(typeof logger.info).toBe('function');
  });
});
