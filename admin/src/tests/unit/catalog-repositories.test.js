import { InMemoryProductRepository } from '../../infrastructure/repositories/InMemoryProductRepository.js';
import { InMemoryCategoryRepository } from '../../infrastructure/repositories/InMemoryCategoryRepository.js';

describe('InMemoryProductRepository', () => {
  test('list returns products', async () => {
    const repository = new InMemoryProductRepository();
    const products = await repository.list();
    expect(products.length).toBeGreaterThan(0);
  });

  test('list supports category and maxPrice filters', async () => {
    const repository = new InMemoryProductRepository();

    const products = await repository.list({ category: 'electronica', maxPrice: 300 });

    expect(products.length).toBe(1);
    expect(products[0].id).toBe('SKU-001');
  });

  test('featured filter uses checkout frequency ranking', async () => {
    const repository = new InMemoryProductRepository();

    await repository.registerCheckoutItems([
      { productId: 'SKU-003', quantity: 4 },
      { productId: 'SKU-001', quantity: 1 },
    ]);

    const featuredProducts = await repository.list({ featured: true });

    expect(featuredProducts.length).toBe(2);
    expect(featuredProducts[0].id).toBe('SKU-003');
    expect(featuredProducts[0].featured).toBe(true);
    expect(featuredProducts[1].id).toBe('SKU-001');
  });

  test('findById returns null when not found', async () => {
    const repository = new InMemoryProductRepository();
    const product = await repository.findById('NONE');
    expect(product).toBeNull();
  });

  test('create and update product persist catalog record', async () => {
    const repository = new InMemoryProductRepository();
    const created = await repository.create({
      name: 'Catalog Test',
      sku: 'CAT-001',
      variantGroup: 'CAT-GROUP',
      description: 'catalog product',
      category: 'camisetas',
      imageUrl: 'https://picsum.photos/seed/catalog-test/900/1200',
      images: [],
      colors: ['Negro'],
      sizes: ['M'],
      price: 99.9,
      originalPrice: 129.9,
      discountPercent: 20,
      currency: 'PEN',
      stock: 9,
      featured: false,
      status: 'active',
    });

    const updated = await repository.update(created.id, {
      name: 'Catalog Test Updated',
      sku: 'CAT-001',
      variantGroup: 'CAT-GROUP',
      description: 'catalog product updated',
      category: 'electronica',
      imageUrl: 'https://picsum.photos/seed/catalog-test-2/900/1200',
      images: [],
      colors: ['Negro', 'Azul'],
      sizes: ['M', 'L'],
      price: 109.9,
      originalPrice: 139.9,
      discountPercent: 21,
      currency: 'PEN',
      stock: 7,
      featured: true,
      status: 'inactive',
    });

    expect(updated.name).toBe('Catalog Test Updated');
    expect(updated.status).toBe('inactive');
    expect((await repository.findById(created.id)).status).toBe('inactive');
  });

  test('getOptionCatalog returns colors and sizes', async () => {
    const repository = new InMemoryProductRepository();
    const options = await repository.getOptionCatalog();
    expect(options.colors.length).toBeGreaterThan(0);
    expect(options.sizes.length).toBeGreaterThan(0);
  });

  test('update returns null when product does not exist', async () => {
    const repository = new InMemoryProductRepository();
    expect(await repository.update('missing-product', { name: 'x' })).toBeNull();
  });

  test('create normalizes a minimal payload without images, categories array or inventory', async () => {
    const repository = new InMemoryProductRepository();
    const created = await repository.create({
      name: 'Producto Minimo',
      sku: 'MIN-001',
      category: 'accesorios',
      price: 45,
      currency: 'PEN',
      stock: 3,
      status: 'active',
    });

    expect(created.categories).toEqual(['accesorios']);
    expect(created.images).toEqual([]);
    expect(created.imageUrl).toBe('');
    expect(created.productType).toBe('simple');
    expect(created.prices[0].amount).toBe(45);
    expect(created.inventory).toEqual({ quantity: 3, inStock: true });
  });

  test('create derives colors and sizes from variant attributes when top-level arrays are missing', async () => {
    const repository = new InMemoryProductRepository();
    const created = await repository.create({
      name: 'Producto Variantes',
      sku: 'VAR-001',
      category: 'ropa',
      price: 60,
      currency: 'PEN',
      stock: 5,
      status: 'active',
      variants: [
        {
          attributes: [
            { name: 'Color', value: 'Rojo' },
            { name: 'Talla', value: 'M' },
          ],
        },
      ],
    });

    expect(created.productType).toBe('variable');
    expect(created.colors).toContain('Rojo');
    expect(created.sizes).toContain('M');
  });

  test('create uses explicit prices, inventory and storeAvailability when provided, skipping derived fallbacks', async () => {
    const repository = new InMemoryProductRepository();
    const created = await repository.create({
      name: 'Producto Explicito',
      category: 'accesorios',
      categories: ['accesorios', 'temporada'],
      images: ['https://picsum.photos/seed/explicito/900/1200'],
      attributes: [
        { name: 'Color', values: ['Negro'] },
        { name: 'Size', values: ['M'] },
      ],
      colors: ['Negro'],
      sizes: ['M'],
      variants: [{ sku: 'EXP-01' }],
      prices: [{ currency: 'USD', amount: 30, originalAmount: 40, discountPercent: 25 }],
      inventory: { quantity: 12, inStock: true },
      storeAvailability: [{ storeId: 'store-001', available: true, quantity: 5 }],
      price: 30,
      originalPrice: 40,
      discountPercent: 25,
      currency: 'USD',
      stock: 12,
      featured: true,
      status: 'active',
    });

    expect(created.prices[0].currency).toBe('USD');
    expect(created.inventory).toEqual({ quantity: 12, inStock: true });
    expect(created.storeAvailability).toHaveLength(1);
    expect(created.categories).toEqual(['accesorios', 'temporada']);
  });
});

describe('InMemoryCategoryRepository', () => {
  test('list returns categories', async () => {
    const repository = new InMemoryCategoryRepository();
    const categories = await repository.list();
    expect(categories.length).toBeGreaterThan(0);
  });

  test('category CRUD create/find/update', async () => {
    const repository = new InMemoryCategoryRepository();

    const createdCategory = await repository.create({
      name: 'Accesorios',
      slug: 'accesorios',
      description: 'Accesorios de temporada',
      active: true,
      parentId: 'cat-002',
      imageUrl: 'https://cdn.example.com/categories/accesorios.webp',
    });

    const bySlug = await repository.findBySlug('accesorios');
    expect(bySlug.id).toBe(createdCategory.id);
    expect(bySlug.parentId).toBe('cat-002');
    expect(bySlug.imageUrl).toBe('https://cdn.example.com/categories/accesorios.webp');

    const updatedCategory = await repository.update(createdCategory.id, {
      name: 'Accesorios Premium',
      slug: 'accesorios-premium',
      description: 'Accesorios premium',
      active: false,
      parentId: 'cat-002',
      imageUrl: 'https://cdn.example.com/categories/accesorios-premium.webp',
    });

    expect(updatedCategory.slug).toBe('accesorios-premium');
    expect(updatedCategory.parentId).toBe('cat-002');
    expect(updatedCategory.imageUrl).toBe(
      'https://cdn.example.com/categories/accesorios-premium.webp',
    );
    expect((await repository.findById(createdCategory.id)).active).toBe(false);
    expect(await repository.update('missing-category', updatedCategory)).toBeNull();
  });
});
