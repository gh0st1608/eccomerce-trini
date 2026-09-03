import { jest } from '@jest/globals';
import { LnkUaUrlShortenerClient } from '../../infrastructure/clients/LnkUaUrlShortenerClient.js';

describe('LnkUaUrlShortenerClient', () => {
  test('creates a short link with the configured LNK.ua contract', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: jest.fn().mockReturnValue('application/json') },
      json: jest.fn().mockResolvedValue({ result: { lnk: 'https://lnk.ua/abc123' } }),
    });
    const client = new LnkUaUrlShortenerClient({
      bearerToken: 'public',
    });

    try {
      const result = await client.shorten('https://shop.example.com/cart/shared?token=abc');

      expect(result).toBe('https://lnk.ua/abc123');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://lnk.ua/api/v1/link/create',
        expect.objectContaining({
          method: 'POST',
          headers: {
            authorization: 'Bearer public',
            'content-type': 'application/x-www-form-urlencoded',
          },
          body: 'link=https%3A%2F%2Fshop.example.com%2Fcart%2Fshared%3Ftoken%3Dabc',
        }),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('keeps the original link when LNK.ua cannot shorten it', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false });
    const client = new LnkUaUrlShortenerClient({ bearerToken: 'public' });
    const url = 'https://shop.example.com/cart/shared?token=abc';

    try {
      await expect(client.shorten(url)).resolves.toBe(url);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
