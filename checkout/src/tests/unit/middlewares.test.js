import { sanitizeMiddleware } from '../../infrastructure/middlewares/sanitize.middleware.js';
import { validateBody } from '../../infrastructure/middlewares/validate.middleware.js';
import { errorMiddleware } from '../../infrastructure/middlewares/error.middleware.js';
import { checkoutSchema } from '../../shared/validation/checkout.schema.js';
import { jest } from '@jest/globals';

describe('Middlewares', () => {
  test('sanitizeMiddleware strips angle brackets', () => {
    const req = { body: { a: '<bad>' }, query: {}, params: {} };
    sanitizeMiddleware(req, {}, () => {});
    expect(req.body.a).toBe('bad');
  });

  test('validateBody passes for valid body', () => {
    const req = {
      body: {
        items: [{ productId: 'SKU-001', quantity: 1 }],
        customer: { phone: '999999999', firstName: 'Ana', lastName: 'Perez' },
        delivery: { method: 'courier' },
      },
    };
    const next = jest.fn();
    validateBody(checkoutSchema)(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('validateBody passes error for invalid body', () => {
    const req = { body: { items: [] } };
    const next = jest.fn();
    validateBody(checkoutSchema)(req, {}, next);
    expect(next.mock.calls[0][0]).toBeTruthy();
  });

  test('errorMiddleware maps oversized body to 413', () => {
    const req = { context: { traceId: 't1' }, log: { error: jest.fn() } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

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
