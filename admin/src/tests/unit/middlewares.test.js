import { jest } from '@jest/globals';
import { trace } from '@opentelemetry/api';
import { sanitizeMiddleware } from '../../infrastructure/middlewares/sanitize.middleware.js';
import { validateBody } from '../../infrastructure/middlewares/validate.middleware.js';
import { requestContextMiddleware } from '../../infrastructure/middlewares/request-context.middleware.js';
import { errorMiddleware } from '../../infrastructure/middlewares/error.middleware.js';
import { publicReadAuthMiddleware } from '../../infrastructure/middlewares/public-read-auth.middleware.js';
import { createProductSchema } from '../../shared/validation/product.schema.js';
import { ValidationError, UnauthorizedError } from '../../domain/exceptions/index.js';

describe('Middlewares', () => {
  test('publicReadAuthMiddleware accepts the public token and the full admin token', () => {
    const publicToken = process.env.PUBLIC_API_TOKEN ?? 'trini-public-readonly-token';
    const adminToken = process.env.ADMIN_AUTH_TOKEN ?? 'trini-admin-local-token';

    const nextForPublic = jest.fn();
    const publicRes = { setHeader: jest.fn() };
    publicReadAuthMiddleware(
      { method: 'GET', headers: { authorization: `Bearer ${publicToken}` } },
      publicRes,
      nextForPublic,
    );
    expect(nextForPublic).toHaveBeenCalledWith();
    expect(publicRes.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      expect.stringMatching(/^public, max-age=\d+$/),
    );

    const nextForAdmin = jest.fn();
    const adminRes = { setHeader: jest.fn() };
    publicReadAuthMiddleware(
      { method: 'GET', headers: { authorization: `Bearer ${adminToken}` } },
      adminRes,
      nextForAdmin,
    );
    expect(nextForAdmin).toHaveBeenCalledWith();
    expect(adminRes.setHeader).not.toHaveBeenCalled();
  });

  test('publicReadAuthMiddleware only marks public GETs as cacheable', () => {
    const publicToken = process.env.PUBLIC_API_TOKEN ?? 'trini-public-readonly-token';
    const res = { setHeader: jest.fn() };
    publicReadAuthMiddleware(
      { method: 'POST', headers: { authorization: `Bearer ${publicToken}` } },
      res,
      jest.fn(),
    );
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  test('publicReadAuthMiddleware rejects missing or invalid tokens', () => {
    const nextMissing = jest.fn();
    publicReadAuthMiddleware({ headers: {} }, {}, nextMissing);
    expect(nextMissing.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);

    const nextInvalid = jest.fn();
    publicReadAuthMiddleware({ headers: { authorization: 'Bearer wrong-token' } }, {}, nextInvalid);
    expect(nextInvalid.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
  });

  test('sanitize body', () => {
    const req = {
      body: { name: '<bad>' },
      params: { id: '<abc>' },
      query: { text: '<x>' },
    };
    sanitizeMiddleware(req, {}, () => {});
    expect(req.body.name).toBe('bad');
    expect(req.params.id).toBe('abc');
    expect(req.query.text).toBe('x');
  });

  test('validate body success', () => {
    const req = {
      body: {
        name: 'Producto Test',
        sku: 'SKU-T-01',
        category: 'test',
        price: 10,
        currency: 'PEN',
        stock: 1,
        status: 'active',
      },
    };
    const next = jest.fn();
    validateBody(createProductSchema)(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('validate body error', () => {
    const req = { body: { name: 'x' } };
    const next = jest.fn();
    validateBody(createProductSchema)(req, {}, next);
    expect(next.mock.calls[0][0]).toBeTruthy();
  });

  test('request context uses fallback trace and custom request id', () => {
    const req = { headers: { 'x-request-id': 'req-1' } };
    const res = { setHeader: jest.fn() };
    jest.spyOn(trace, 'getSpan').mockReturnValue(undefined);

    requestContextMiddleware(req, res, () => {});

    expect(req.context.requestId).toBe('req-1');
    expect(req.context.traceId).toBe('no-trace');
    trace.getSpan.mockRestore();
  });

  test('error middleware handles domain error', () => {
    const req = { context: { traceId: 't1' }, log: { error: jest.fn() } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() };

    errorMiddleware(new ValidationError('bad input'), req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });

  test('error middleware handles unknown error', () => {
    const req = { context: { traceId: 't1' }, log: { error: jest.fn() } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() };

    errorMiddleware(new Error('unknown'), req, res, () => {});

    expect(req.log.error).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('error middleware maps CORS rejection to 403', () => {
    const req = { context: { traceId: 't1' }, log: { error: jest.fn(), warn: jest.fn() } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() };

    errorMiddleware(new Error('Not allowed by CORS'), req, res, () => {});

    expect(req.log.error).toHaveBeenCalledTimes(0);
    expect(req.log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ event: expect.objectContaining({ category: 'cors' }) }),
      'Security event: cors.origin_rejected',
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Origin not allowed',
        },
      }),
    );
  });

  test('error middleware maps body too large to 413', () => {
    const req = { context: { traceId: 't1' }, log: { error: jest.fn() } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), setHeader: jest.fn() };

    errorMiddleware({ type: 'entity.too.large', status: 413 }, req, res, () => {});

    expect(req.log.error).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request body too large',
        },
      }),
    );
  });
});
