import { BuildWhatsappCheckoutUseCase } from '../../application/usecases/BuildWhatsappCheckoutUseCase.js';
import { ValidationError, NotFoundError } from '../../domain/exceptions/index.js';
import { jest } from '@jest/globals';

describe('Use Cases', () => {
  test('BuildWhatsappCheckoutUseCase throws ValidationError when cart is empty', async () => {
    const useCase = new BuildWhatsappCheckoutUseCase({
      productRepository: { findById: jest.fn() },
      storeRepository: { findById: jest.fn() },
      whatsappLinkService: { buildCheckoutLink: jest.fn() },
    });

    await expect(
      useCase.execute({
        items: [],
        customer: { phone: '51999999999', firstName: 'Ana', lastName: 'Perez' },
        delivery: { method: 'courier' },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('BuildWhatsappCheckoutUseCase throws NotFoundError when product is missing', async () => {
    const useCase = new BuildWhatsappCheckoutUseCase({
      productRepository: {
        findById: jest.fn().mockResolvedValue(null),
        registerCheckoutItems: jest.fn(),
      },
      storeRepository: { findById: jest.fn() },
      whatsappLinkService: { buildCheckoutLink: jest.fn() },
    });

    await expect(
      useCase.execute({
        items: [{ productId: 'MISSING', quantity: 1 }],
        customer: { phone: '51999999999', firstName: 'Ana', lastName: 'Perez' },
        delivery: { method: 'courier' },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test('BuildWhatsappCheckoutUseCase requires pickup delivery for gift items', async () => {
    const useCase = new BuildWhatsappCheckoutUseCase({
      productRepository: {
        findById: jest.fn(),
        registerCheckoutItems: jest.fn(),
      },
      storeRepository: { findById: jest.fn() },
      whatsappLinkService: { buildCheckoutLink: jest.fn() },
    });

    await expect(
      useCase.execute({
        items: [{ productId: 'SKU-001', quantity: 1, isGift: true }],
        customer: { phone: '51999999999', firstName: 'Ana', lastName: 'Perez' },
        delivery: { method: 'courier' },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('BuildWhatsappCheckoutUseCase returns whatsapp payload', async () => {
    const whatsappLinkService = {
      buildCheckoutLink: jest.fn().mockReturnValue({ checkoutUrl: 'https://wa.me/test' }),
    };
    const useCase = new BuildWhatsappCheckoutUseCase({
      productRepository: {
        findById: jest.fn().mockResolvedValue({
          id: 'SKU-001',
          name: 'Item',
          category: 'camisetas',
          price: 10,
          originalPrice: 15,
          discountPercent: 33,
        }),
        registerCheckoutItems: jest.fn(),
      },
      storeRepository: { findById: jest.fn() },
      whatsappLinkService,
    });

    const result = await useCase.execute({
      items: [{ productId: 'SKU-001', quantity: 2 }],
      customer: { phone: '51999999999', firstName: 'Ana', lastName: 'Perez' },
      delivery: { method: 'courier' },
    });

    expect(result.checkoutUrl).toBe('https://wa.me/test');
    expect(whatsappLinkService.buildCheckoutLink).toHaveBeenCalledTimes(1);
    expect(whatsappLinkService.buildCheckoutLink).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            category: 'camisetas',
            originalPrice: 15,
            discountPercent: 33,
            unitPrice: 10,
          }),
        ],
      }),
      expect.objectContaining({ method: 'courier' }),
      expect.objectContaining({ sharedCartUrl: null }),
    );
  });

  test('BuildWhatsappCheckoutUseCase includes shared cart URL when share service is configured', async () => {
    const checkoutShareLinkService = {
      buildUrl: jest.fn().mockReturnValue('https://example.com/api/v1/checkout/shared?token=abc'),
    };

    const useCase = new BuildWhatsappCheckoutUseCase({
      productRepository: {
        findById: jest.fn().mockResolvedValue({
          id: 'SKU-001',
          name: 'Item',
          category: 'camisetas',
          price: 10,
        }),
        registerCheckoutItems: jest.fn(),
      },
      storeRepository: { findById: jest.fn() },
      whatsappLinkService: {
        buildCheckoutLink: jest.fn().mockReturnValue({ checkoutUrl: 'https://wa.me/test' }),
      },
      checkoutShareLinkService,
    });

    const result = await useCase.execute(
      {
        items: [{ productId: 'SKU-001', quantity: 1 }],
        customer: { phone: '51999999999', firstName: 'Ana', lastName: 'Perez' },
        delivery: { method: 'courier' },
      },
      { publicBaseUrl: 'https://shop.example.com' },
    );

    expect(checkoutShareLinkService.buildUrl).toHaveBeenCalledTimes(1);
    expect(result.sharedCartUrl).toBe('https://example.com/api/v1/checkout/shared?token=abc');
  });

  test('BuildWhatsappCheckoutUseCase registers checkout items for featured ranking', async () => {
    const registerCheckoutItems = jest.fn().mockResolvedValue(undefined);
    const useCase = new BuildWhatsappCheckoutUseCase({
      productRepository: {
        findById: jest.fn().mockResolvedValue({ id: 'SKU-001', name: 'Item', price: 10 }),
        registerCheckoutItems,
      },
      storeRepository: { findById: jest.fn() },
      whatsappLinkService: {
        buildCheckoutLink: jest.fn().mockReturnValue({ checkoutUrl: 'https://wa.me/test' }),
      },
    });

    await useCase.execute({
      items: [{ productId: 'SKU-001', quantity: 3 }],
      customer: { phone: '51999999999', firstName: 'Ana', lastName: 'Perez' },
      delivery: { method: 'courier' },
    });

    expect(registerCheckoutItems).toHaveBeenCalledWith([
      expect.objectContaining({
        productId: 'SKU-001',
        quantity: 3,
      }),
    ]);
  });

  test('BuildWhatsappCheckoutUseCase rejects unavailable pickup store', async () => {
    const useCase = new BuildWhatsappCheckoutUseCase({
      productRepository: {
        findById: jest.fn().mockResolvedValue({ id: 'SKU-001', name: 'Item', price: 10 }),
        registerCheckoutItems: jest.fn(),
      },
      storeRepository: {
        findById: jest.fn().mockResolvedValue(null),
      },
      whatsappLinkService: {
        buildCheckoutLink: jest.fn(),
      },
    });

    await expect(
      useCase.execute({
        items: [{ productId: 'SKU-001', quantity: 1 }],
        customer: { phone: '51999999999', firstName: 'Ana', lastName: 'Perez' },
        delivery: { method: 'pickup', storeId: 'store-missing' },
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});
