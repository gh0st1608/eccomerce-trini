import { jest } from '@jest/globals';
import { InMemoryInternalUserRepository } from '../../infrastructure/repositories/InMemoryInternalUserRepository.js';
import { successResponse, errorResponse } from '../../shared/utils/response.js';
import { sanitizeString } from '../../shared/utils/sanitize.js';
import { createProductSchema } from '../../shared/validation/product.schema.js';
import { createInternalUserSchema } from '../../shared/validation/internal-user.schema.js';
import { createCategorySchema } from '../../shared/validation/category.schema.js';

describe('Repositories, utils and validation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('internal user repository list/create', async () => {
    const repo = new InMemoryInternalUserRepository();
    const before = await repo.list();
    await repo.create({ name: 'Operador', email: 'op@trini.local', role: 'operator', active: true });
    const after = await repo.list();
    expect(after.length).toBeGreaterThan(before.length);
  });

  test('response and sanitize utils', () => {
    expect(successResponse({ data: { ok: true } }).success).toBe(true);
    expect(errorResponse({ code: 'X', message: 'Y' }).success).toBe(false);
    expect(successResponse({}).message).toBe('');
    expect(errorResponse({}).error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(sanitizeString('<h1>x</h1>')).toBe('h1x/h1');
  });

  test('validation schemas', () => {
    const pngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3z4xkAAAAASUVORK5CYII=';

    const product = createProductSchema.parse({
      name: 'Camisa Admin',
      sku: 'ADM-01',
      category: 'camisas',
      imageUrl: pngDataUrl,
      images: [pngDataUrl],
      price: 20,
      currency: 'PEN',
      stock: 2,
      status: 'active',
    });

    const user = createInternalUserSchema.parse({
      name: 'Soporte',
      email: 'soporte@trini.local',
      role: 'support',
      active: true,
    });

    const category = createCategorySchema.parse({
      name: 'Polos',
      slug: 'polos',
      description: 'Categoria de polos',
      active: true,
    });

    expect(product.sku).toBe('ADM-01');
    expect(product.imageUrl).toBe(pngDataUrl);
    expect(user.role).toBe('support');
    expect(category.slug).toBe('polos');
  });
});
