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
import { WhatsappClient } from '../../infrastructure/clients/WhatsappClient.js';
import { requestContextMiddleware } from '../../infrastructure/middlewares/request-context.middleware.js';
import { createLogger } from '../../observability/logger/create-logger.js';

describe('Domain and observability helpers', () => {
  test('error classes expose metadata', () => {
    const base = new BaseError('x', 'X', 400);
    expect(base.code).toBe('X');
    expect(new ValidationError().statusCode).toBe(400);
    expect(new BusinessError().code).toBe('BUSINESS_ERROR');
    expect(new NotFoundError().statusCode).toBe(404);
    expect(new UnauthorizedError().statusCode).toBe(401);
    expect(new ForbiddenError().statusCode).toBe(403);
    expect(new ConflictError().statusCode).toBe(409);
    expect(new InternalServerError().statusCode).toBe(500);
  });

  test('whatsapp client builds encoded URL', () => {
    const client = new WhatsappClient({ whatsappPhone: '51999999999' });
    const url = client.buildLink('hola mundo');
    expect(url).toContain('wa.me/51999999999');
    expect(url).toContain('hola%20mundo');
  });

  test('request context middleware sets ids and header', () => {
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

    expect(req.context.requestId).toBeTruthy();
    expect(req.context.traceId).toHaveLength(32);
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', expect.any(String));
    trace.getSpan.mockRestore();
  });

  test('logger factory creates pino instance', () => {
    const logger = createLogger({ appName: 'svc', environment: 'test', level: 'info' });
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.fatal).toBe('function');
  });
});
