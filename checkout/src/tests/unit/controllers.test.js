import { createCheckoutController } from '../../infrastructure/controllers/checkout.controller.js';
import { jest } from '@jest/globals';

describe('Controllers', () => {
  test('checkout controller returns created response', async () => {
    const req = {
      context: { traceId: 't1' },
      body: { items: [] },
      protocol: 'https',
      get: jest.fn().mockReturnValue('shop.example.com'),
      headers: {},
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    const controller = createCheckoutController({
      buildWhatsappCheckoutUseCase: {
        execute: jest.fn().mockResolvedValue({ checkoutUrl: 'https://wa.me/1' }),
      },
    });

    await controller.checkoutByWhatsapp(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledTimes(1);
  });

  test('checkout controller resolves shared checkout token', async () => {
    const req = { context: { traceId: 't1' }, query: { token: 'signed-token' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    const controller = createCheckoutController({
      buildWhatsappCheckoutUseCase: {
        execute: jest.fn(),
      },
      resolveSharedCheckoutUseCase: {
        execute: jest.fn().mockReturnValue({ checkout: { itemCount: 1, subtotal: 10, items: [] } }),
      },
    });

    await controller.resolveSharedCheckout(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });

  test('checkout controller returns preview HTML for shared checkout links', async () => {
    const req = {
      context: { traceId: 't1' },
      query: { token: 'signed-token' },
      headers: { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'shop.example.com' },
      protocol: 'https',
      get: jest.fn().mockReturnValue('shop.example.com'),
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    const next = jest.fn();

    const controller = createCheckoutController({
      buildWhatsappCheckoutUseCase: {
        execute: jest.fn(),
      },
      resolveSharedCheckoutUseCase: {
        execute: jest.fn(),
      },
    });

    await controller.shareCheckoutPreview(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.type).toHaveBeenCalledWith('html');
    expect(res.send).toHaveBeenCalledTimes(1);
    const html = res.send.mock.calls[0][0];
    expect(html).toContain('og:image');
    expect(html).toContain('https://shop.example.com/logo-mayo-collection.png');
    expect(html).toContain('/cart/shared?token=signed-token');
    expect(next).not.toHaveBeenCalled();
  });
});
