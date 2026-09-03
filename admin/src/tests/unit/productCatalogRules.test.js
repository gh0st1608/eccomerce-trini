import {
  normalizeProductRecord,
  applyFilters,
  sortProducts,
  computeFeaturedProductIds,
  enrichProduct,
  buildOptionCatalog,
  DEFAULT_COLORS,
  DEFAULT_SIZES,
} from '../../infrastructure/repositories/shared/productCatalogRules.js';

describe('productCatalogRules', () => {
  describe('normalizeProductRecord', () => {
    test('derives images/categories/colors/sizes/prices/inventory from a minimal legacy record', () => {
      const normalized = normalizeProductRecord({
        id: 'p1',
        name: 'Polo',
        category: 'ropa',
        imageUrl: 'https://img/p1.jpg',
        price: 50,
        stock: 5,
      });

      expect(normalized.categories).toEqual(['ropa']);
      expect(normalized.images).toEqual(['https://img/p1.jpg']);
      expect(normalized.productType).toBe('simple');
      expect(normalized.prices).toEqual([
        { currency: 'PEN', amount: 50, originalAmount: undefined, discountPercent: undefined },
      ]);
      expect(normalized.inventory).toEqual({ quantity: 5, inStock: true });
      expect(normalized.status).toBe('active');
    });

    test('derives color/size attributes from variants when not explicit', () => {
      const normalized = normalizeProductRecord({
        id: 'p2',
        name: 'Zapatilla',
        category: 'deportes',
        variants: [{ attributes: [{ name: 'Color', value: 'Rojo' }, { name: 'Talla', value: 'M' }] }],
        prices: [{ currency: 'PEN', amount: 100 }],
      });

      expect(normalized.colors).toEqual(['Rojo']);
      expect(normalized.sizes).toEqual(['M']);
      expect(normalized.attributes.some((a) => a.name === 'Color')).toBe(true);
      expect(normalized.attributes.some((a) => a.name === 'Size')).toBe(true);
      expect(normalized.productType).toBe('variable');
    });

    test('keeps explicit attributes and inventory when already present', () => {
      const normalized = normalizeProductRecord({
        id: 'p3',
        name: 'Reloj',
        categories: ['accesorios'],
        attributes: [{ name: 'Color', values: ['Negro'] }],
        colors: ['Negro'],
        inventory: { quantity: 3, inStock: true },
        prices: [{ currency: 'PEN', amount: 200 }],
        status: 'inactive',
      });

      expect(normalized.attributes).toHaveLength(1);
      expect(normalized.inventory).toEqual({ quantity: 3, inStock: true });
      expect(normalized.status).toBe('inactive');
    });
  });

  describe('applyFilters', () => {
    const products = [
      { id: 'a', name: 'A', categories: ['ropa'], price: 50, featured: true, status: 'active' },
      { id: 'b', name: 'B', categories: ['deportes'], price: 150, featured: false, status: 'inactive' },
    ];

    test('filters by category, maxPrice and featured', () => {
      expect(applyFilters(products, { category: 'ropa' })).toHaveLength(1);
      expect(applyFilters(products, { maxPrice: 100 })).toHaveLength(1);
      expect(applyFilters(products, { featured: true })).toEqual([products[0]]);
      expect(applyFilters(products, {})).toHaveLength(2);
    });

    test('filters by product status when requested', () => {
      expect(applyFilters(products, { status: 'active' })).toEqual([products[0]]);
      expect(applyFilters(products, { status: 'inactive' })).toEqual([products[1]]);
    });
  });

  describe('sortProducts', () => {
    test('sorts by checkoutFrequency, then featured, then name', () => {
      const products = [
        { id: 'a', name: 'Zeta', featured: false, checkoutFrequency: 0 },
        { id: 'b', name: 'Alfa', featured: true, checkoutFrequency: 0 },
        { id: 'c', name: 'Beta', featured: false, checkoutFrequency: 5 },
      ];

      const sorted = sortProducts(products).map((p) => p.id);
      expect(sorted).toEqual(['c', 'b', 'a']);
    });
  });

  describe('computeFeaturedProductIds', () => {
    const products = [
      { id: 'a', featured: true },
      { id: 'b', featured: false },
    ];

    test('ranks by checkout frequency when available', () => {
      const frequencyMap = new Map([['b', 3]]);
      expect(computeFeaturedProductIds(products, frequencyMap)).toEqual(new Set(['b']));
    });

    test('falls back to the static featured flag when no checkout history exists', () => {
      expect(computeFeaturedProductIds(products, new Map())).toEqual(new Set(['a']));
    });
  });

  describe('enrichProduct', () => {
    test('normalizes and adds featured/checkoutFrequency', () => {
      const enriched = enrichProduct(
        { id: 'a', name: 'A', category: 'ropa', price: 10 },
        new Set(['a']),
        new Map([['a', 2]]),
      );

      expect(enriched.featured).toBe(true);
      expect(enriched.checkoutFrequency).toBe(2);
    });
  });

  describe('buildOptionCatalog', () => {
    test('aggregates colors, sizes, productTypes and attribute names, including defaults', () => {
      const catalog = buildOptionCatalog([
        normalizeProductRecord({
          id: 'a',
          name: 'A',
          category: 'ropa',
          colors: ['Morado'],
          sizes: ['42'],
          productType: 'variable',
          attributes: [{ name: 'Material', values: ['Algodon'] }],
          prices: [{ currency: 'PEN', amount: 10 }],
        }),
      ]);

      expect(catalog.colors).toEqual(expect.arrayContaining([...DEFAULT_COLORS, 'Morado']));
      expect(catalog.sizes).toEqual(expect.arrayContaining([...DEFAULT_SIZES, '42']));
      expect(catalog.productTypes).toEqual(['variable']);
      expect(catalog.attributeNames).toEqual(expect.arrayContaining(['Material']));
    });
  });
});
