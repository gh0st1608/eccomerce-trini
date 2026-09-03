import { WhatsappLinkService } from '../../domain/services/WhatsappLinkService.js';
import { jest } from '@jest/globals';

describe('WhatsappLinkService', () => {
  test('buildCheckoutLink sends full customer name followed by shared cart link', async () => {
    const whatsappClient = { buildLink: jest.fn().mockReturnValue('https://wa.me/1') };
    const service = new WhatsappLinkService({ whatsappClient });

    await service.buildCheckoutLink(
      { items: [{ productName: 'Jean', quantity: 1, total: 120 }] },
      { method: 'courier' },
      {
        customer: {
          firstName: 'Ana',
          paternalLastName: 'Perez',
          maternalLastName: 'Gomez',
        },
        sharedCartUrl: 'https://shop.example.com/cart/shared?token=abc',
      },
    );

    expect(whatsappClient.buildLink).toHaveBeenCalledWith(
      'Ana Perez Gomez\nhttps://shop.example.com/cart/shared?token=abc',
    );
  });

  test('buildCheckoutLink sends only shared cart link in message', async () => {
    const whatsappClient = { buildLink: jest.fn().mockReturnValue('https://wa.me/1') };
    const service = new WhatsappLinkService({ whatsappClient });

    const result = await service.buildCheckoutLink({
      items: [{
        productName: 'Camiseta',
        category: 'camisetas',
        size: 'M',
        color: 'Negro',
        unitPrice: 50,
        originalPrice: 80,
        discountPercent: 38,
        quantity: 2,
        total: 100,
      }],
    }, { method: 'courier' }, { sharedCartUrl: 'https://shop.example.com/cart/shared?token=abc' });

    expect(result.checkoutUrl).toBe('https://wa.me/1');
    expect(result.subtotal).toBe(100);
    expect(result.itemCount).toBe(1);
    expect(whatsappClient.buildLink).toHaveBeenCalledWith('https://shop.example.com/cart/shared?token=abc');
  });

  test('buildCheckoutLink still computes metrics for pickup flow', async () => {
    const whatsappClient = { buildLink: jest.fn().mockReturnValue('https://wa.me/1') };
    const service = new WhatsappLinkService({ whatsappClient });

    const result = await service.buildCheckoutLink(
      {
        items: [{ productName: 'Jean', quantity: 1, total: 120 }],
      },
      {
        method: 'pickup',
        storeName: 'Trini Miraflores',
        storeAddress: 'Av. Larco 512',
        storeDistrict: 'Miraflores',
      },
      { sharedCartUrl: 'https://shop.example.com/cart/shared?token=pickup' },
    );

    expect(result.subtotal).toBe(120);
    expect(result.itemCount).toBe(1);
    expect(whatsappClient.buildLink).toHaveBeenCalledWith('https://shop.example.com/cart/shared?token=pickup');
  });

  test('buildCheckoutLink sends shortened URL when shortener resolves one', async () => {
    const whatsappClient = { buildLink: jest.fn().mockReturnValue('https://wa.me/1') };
    const shortener = { shorten: jest.fn().mockResolvedValue('https://lnk.ua/abc123') };
    const service = new WhatsappLinkService({ whatsappClient, urlShortenerClient: shortener });

    const result = await service.buildCheckoutLink(
      {
        items: [{ productName: 'Jean', quantity: 1, total: 120 }],
      },
      { method: 'courier' },
      { sharedCartUrl: 'https://example.com/api/v1/checkout/shared?token=abc' },
    );

    expect(result.sharedCartUrl).toBe('https://example.com/api/v1/checkout/shared?token=abc');
    expect(result.shortSharedCartUrl).toBe('https://lnk.ua/abc123');
    expect(shortener.shorten).toHaveBeenCalledWith('https://example.com/api/v1/checkout/shared?token=abc');
    expect(whatsappClient.buildLink).toHaveBeenCalledWith('https://lnk.ua/abc123');
  });
});
