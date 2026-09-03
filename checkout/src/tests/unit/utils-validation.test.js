import { successResponse, errorResponse } from '../../shared/utils/response.js';
import { sanitizeString } from '../../shared/utils/sanitize.js';
import { checkoutSchema } from '../../shared/validation/checkout.schema.js';

describe('Utils and Validation', () => {
  test('successResponse shape', () => {
    const result = successResponse({ data: { ok: true }, message: 'ok', traceId: 'x' });
    expect(result.success).toBe(true);
  });

  test('errorResponse shape', () => {
    const result = errorResponse({ code: 'ERR', message: 'bad', traceId: 'x' });
    expect(result.success).toBe(false);
  });

  test('sanitizeString strips html chars', () => {
    expect(sanitizeString('<hello>')).toBe('hello');
  });

  test('checkout schema accepts valid payload', () => {
    const parsed = checkoutSchema.parse({
      items: [{ productId: 'SKU-001', quantity: 1 }],
          delivery: { method: 'courier' },
          customer: { phone: '51999999999', firstName: 'Ana', lastName: 'Perez' },
    });
    expect(parsed.items.length).toBe(1);
  });
});
