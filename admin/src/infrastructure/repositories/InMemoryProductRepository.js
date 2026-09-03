import { randomUUID } from 'node:crypto';
import { Product } from '../../domain/entities/Product.js';
import { ProductRepositoryPort } from '../../application/ports/ProductRepositoryPort.js';
import {
  normalizeProductRecord,
  computeFeaturedProductIds,
  enrichProduct,
  applyFilters,
  sortProducts,
  buildOptionCatalog,
} from './shared/productCatalogRules.js';

export const PRODUCTS = [
  {
    id: 'SKU-001',
    name: 'Smart Speaker Wave Mini',
    sku: 'SKU-001',
    variantGroup: 'WAVE-MINI',
    description: 'Parlante inteligente compacto con asistente de voz integrado.',
    category: 'electronica',
    categories: ['electronica', 'hogar-conectado'],
    imageUrl: 'https://picsum.photos/seed/ecom-speaker/900/1200',
    images: [
      'https://picsum.photos/seed/ecom-speaker/900/1200',
      'https://picsum.photos/seed/ecom-speaker-alt1/900/1200',
    ],
    productType: 'variable',
    attributes: [
      { name: 'Color', values: ['Negro', 'Blanco'] },
      { name: 'Conectividad', values: ['Wi-Fi', 'Bluetooth'] },
    ],
    variants: [
      {
        id: 'SKU-001-BLK',
        sku: 'SKU-001-BLK',
        name: 'Wave Mini Negro',
        attributes: [{ name: 'Color', value: 'Negro' }],
        prices: [{ currency: 'PEN', amount: 249.9, originalAmount: 299.9, discountPercent: 17 }],
        inventory: { quantity: 18, inStock: true },
      },
      {
        id: 'SKU-001-WHT',
        sku: 'SKU-001-WHT',
        name: 'Wave Mini Blanco',
        attributes: [{ name: 'Color', value: 'Blanco' }],
        prices: [{ currency: 'PEN', amount: 249.9 }],
        inventory: { quantity: 12, inStock: true },
      },
      {
        id: 'SKU-001-BLU',
        sku: 'SKU-001-BLU',
        name: 'Wave Mini Azul',
        attributes: [{ name: 'Color', value: 'Azul' }],
        prices: [{ currency: 'PEN', amount: 269.9 }],
        inventory: { quantity: 10, inStock: true },
      },
    ],
    prices: [{ currency: 'PEN', amount: 249.9, originalAmount: 299.9, discountPercent: 17 }],
    inventory: { quantity: 40, inStock: true },
    storeAvailability: [
      { storeId: 'store-lima-centro', available: true, quantity: 20 },
      { storeId: 'store-san-isidro', available: true, quantity: 20 },
    ],
    colors: ['Negro', 'Blanco', 'Azul'],
    sizes: [],
    price: 249.9,
    originalPrice: 299.9,
    discountPercent: 17,
    currency: 'PEN',
    stock: 40,
    featured: true,
    status: 'active',
  },
  {
    id: 'SKU-004',
    name: 'Auriculares Pulse ANC',
    sku: 'SKU-004',
    variantGroup: 'PULSE-ANC',
    description: 'Auriculares con cancelacion activa de ruido y bateria extendida.',
    category: 'electronica',
    categories: ['electronica', 'audio'],
    imageUrl: 'https://picsum.photos/seed/ecom-headphones/900/1200',
    images: [
      'https://picsum.photos/seed/ecom-headphones/900/1200',
      'https://picsum.photos/seed/ecom-headphones-alt1/900/1200',
    ],
    productType: 'variable',
    attributes: [
      { name: 'Color', values: ['Negro', 'Plata', 'Azul'] },
      { name: 'Conexion', values: ['Bluetooth 5.3'] },
    ],
    variants: [
      {
        id: 'SKU-004-BLK',
        sku: 'SKU-004-BLK',
        name: 'Pulse ANC Negro',
        attributes: [{ name: 'Color', value: 'Negro' }],
        prices: [{ currency: 'PEN', amount: 399.9, originalAmount: 459.9, discountPercent: 13 }],
        inventory: { quantity: 10, inStock: true },
      },
      {
        id: 'SKU-004-SLV',
        sku: 'SKU-004-SLV',
        name: 'Pulse ANC Plata',
        attributes: [{ name: 'Color', value: 'Plata' }],
        prices: [{ currency: 'PEN', amount: 419.9 }],
        inventory: { quantity: 9, inStock: true },
      },
      {
        id: 'SKU-004-BLU',
        sku: 'SKU-004-BLU',
        name: 'Pulse ANC Azul',
        attributes: [{ name: 'Color', value: 'Azul' }],
        prices: [{ currency: 'PEN', amount: 429.9 }],
        inventory: { quantity: 7, inStock: true },
      },
    ],
    prices: [{ currency: 'PEN', amount: 399.9, originalAmount: 459.9, discountPercent: 13 }],
    inventory: { quantity: 26, inStock: true },
    storeAvailability: [
      { storeId: 'store-lima-centro', available: true, quantity: 14 },
      { storeId: 'store-san-isidro', available: true, quantity: 12 },
    ],
    colors: ['Negro', 'Plata', 'Azul'],
    sizes: [],
    price: 399.9,
    originalPrice: 459.9,
    discountPercent: 13,
    currency: 'PEN',
    stock: 26,
    featured: false,
    status: 'active',
  },
  {
    id: 'SKU-005',
    name: 'Tablet Nova 11',
    sku: 'SKU-005',
    variantGroup: 'NOVA-11',
    description: 'Tablet de 11 pulgadas para trabajo y entretenimiento.',
    category: 'electronica',
    categories: ['electronica', 'tablets'],
    imageUrl: 'https://picsum.photos/seed/ecom-tablet/900/1200',
    images: [
      'https://picsum.photos/seed/ecom-tablet/900/1200',
      'https://picsum.photos/seed/ecom-tablet-alt1/900/1200',
    ],
    productType: 'variable',
    attributes: [
      { name: 'Almacenamiento', values: ['128GB', '256GB', '512GB'] },
      { name: 'Color', values: ['Grafito'] },
    ],
    variants: [
      {
        id: 'SKU-005-128',
        sku: 'SKU-005-128',
        name: 'Nova 11 128GB',
        attributes: [{ name: 'Almacenamiento', value: '128GB' }],
        prices: [{ currency: 'PEN', amount: 899.9 }],
        inventory: { quantity: 8, inStock: true },
      },
      {
        id: 'SKU-005-256',
        sku: 'SKU-005-256',
        name: 'Nova 11 256GB',
        attributes: [{ name: 'Almacenamiento', value: '256GB' }],
        prices: [{ currency: 'PEN', amount: 1049.9 }],
        inventory: { quantity: 6, inStock: true },
      },
      {
        id: 'SKU-005-512',
        sku: 'SKU-005-512',
        name: 'Nova 11 512GB',
        attributes: [{ name: 'Almacenamiento', value: '512GB' }],
        prices: [{ currency: 'PEN', amount: 1249.9 }],
        inventory: { quantity: 4, inStock: true },
      },
    ],
    prices: [{ currency: 'PEN', amount: 899.9 }],
    inventory: { quantity: 18, inStock: true },
    storeAvailability: [
      { storeId: 'store-lima-centro', available: true, quantity: 10 },
      { storeId: 'store-san-isidro', available: true, quantity: 8 },
    ],
    colors: ['Grafito'],
    sizes: [],
    price: 899.9,
    currency: 'PEN',
    stock: 18,
    featured: false,
    status: 'active',
  },
  {
    id: 'SKU-002',
    name: 'Silla Ergonomica AeroFlex',
    sku: 'SKU-002',
    variantGroup: 'AEROFLEX-CHAIR',
    description: 'Silla ergonomica para home office con soporte lumbar ajustable.',
    category: 'hogar',
    categories: ['hogar', 'oficina'],
    imageUrl: 'https://picsum.photos/seed/ecom-chair/900/1200',
    images: [
      'https://picsum.photos/seed/ecom-chair/900/1200',
      'https://picsum.photos/seed/ecom-chair-alt1/900/1200',
    ],
    productType: 'variable',
    attributes: [
      { name: 'Material', values: ['Malla transpirable', 'Malla premium', 'Eco-cuero'] },
      { name: 'Color', values: ['Gris', 'Negro', 'Azul'] },
    ],
    variants: [
      {
        id: 'SKU-002-GRY',
        sku: 'SKU-002-GRY',
        name: 'AeroFlex Gris',
        attributes: [
          { name: 'Material', value: 'Malla transpirable' },
          { name: 'Color', value: 'Gris' },
        ],
        prices: [{ currency: 'PEN', amount: 699.9, originalAmount: 799.9, discountPercent: 13 }],
        inventory: { quantity: 4, inStock: true },
      },
      {
        id: 'SKU-002-BLK',
        sku: 'SKU-002-BLK',
        name: 'AeroFlex Negro',
        attributes: [
          { name: 'Material', value: 'Malla premium' },
          { name: 'Color', value: 'Negro' },
        ],
        prices: [{ currency: 'PEN', amount: 749.9 }],
        inventory: { quantity: 3, inStock: true },
      },
      {
        id: 'SKU-002-BLU',
        sku: 'SKU-002-BLU',
        name: 'AeroFlex Azul',
        attributes: [
          { name: 'Material', value: 'Eco-cuero' },
          { name: 'Color', value: 'Azul' },
        ],
        prices: [{ currency: 'PEN', amount: 779.9 }],
        inventory: { quantity: 2, inStock: true },
      },
    ],
    prices: [{ currency: 'PEN', amount: 699.9, originalAmount: 799.9, discountPercent: 13 }],
    inventory: { quantity: 9, inStock: true },
    storeAvailability: [
      { storeId: 'store-lima-centro', available: true, quantity: 5 },
      { storeId: 'store-san-isidro', available: true, quantity: 4 },
    ],
    colors: ['Gris'],
    sizes: [],
    price: 699.9,
    originalPrice: 799.9,
    discountPercent: 13,
    currency: 'PEN',
    stock: 9,
    featured: true,
    status: 'active',
  },
  {
    id: 'SKU-006',
    name: 'Luminaria Arc Floor',
    sku: 'SKU-006',
    variantGroup: 'ARC-FLOOR',
    description: 'Lampara de pie con intensidad regulable para sala u oficina.',
    category: 'hogar',
    categories: ['hogar', 'iluminacion'],
    imageUrl: 'https://picsum.photos/seed/ecom-lamp/900/1200',
    images: [
      'https://picsum.photos/seed/ecom-lamp/900/1200',
      'https://picsum.photos/seed/ecom-lamp-alt1/900/1200',
    ],
    productType: 'variable',
    attributes: [
      { name: 'Acabado', values: ['Negro mate', 'Dorado', 'Blanco'] },
      { name: 'Potencia', values: ['30W'] },
    ],
    variants: [
      {
        id: 'SKU-006-BLK',
        sku: 'SKU-006-BLK',
        name: 'Arc Floor Negro mate',
        attributes: [{ name: 'Acabado', value: 'Negro mate' }],
        prices: [{ currency: 'PEN', amount: 329.9 }],
        inventory: { quantity: 7, inStock: true },
      },
      {
        id: 'SKU-006-GLD',
        sku: 'SKU-006-GLD',
        name: 'Arc Floor Dorado',
        attributes: [{ name: 'Acabado', value: 'Dorado' }],
        prices: [{ currency: 'PEN', amount: 349.9 }],
        inventory: { quantity: 6, inStock: true },
      },
      {
        id: 'SKU-006-WHT',
        sku: 'SKU-006-WHT',
        name: 'Arc Floor Blanco',
        attributes: [{ name: 'Acabado', value: 'Blanco' }],
        prices: [{ currency: 'PEN', amount: 339.9 }],
        inventory: { quantity: 5, inStock: true },
      },
    ],
    prices: [{ currency: 'PEN', amount: 329.9 }],
    inventory: { quantity: 18, inStock: true },
    storeAvailability: [
      { storeId: 'store-lima-centro', available: true, quantity: 10 },
      { storeId: 'store-san-isidro', available: true, quantity: 8 },
    ],
    colors: ['Negro', 'Dorado', 'Blanco'],
    sizes: [],
    price: 329.9,
    currency: 'PEN',
    stock: 18,
    featured: false,
    status: 'active',
  },
  {
    id: 'SKU-007',
    name: 'Juego Organizadores FlexBox',
    sku: 'SKU-007',
    variantGroup: 'FLEXBOX',
    description: 'Set modular para ordenar cocina, dormitorio y oficina.',
    category: 'hogar',
    categories: ['hogar', 'organizacion'],
    imageUrl: 'https://picsum.photos/seed/ecom-box/900/1200',
    images: [
      'https://picsum.photos/seed/ecom-box/900/1200',
      'https://picsum.photos/seed/ecom-box-alt1/900/1200',
    ],
    productType: 'variable',
    attributes: [
      { name: 'Tamano', values: ['Pequeno', 'Mediano', 'Grande'] },
      { name: 'Color', values: ['Transparente'] },
    ],
    variants: [
      {
        id: 'SKU-007-S',
        sku: 'SKU-007-S',
        name: 'FlexBox Pequeno',
        attributes: [{ name: 'Tamano', value: 'Pequeno' }],
        prices: [{ currency: 'PEN', amount: 59.9 }],
        inventory: { quantity: 15, inStock: true },
      },
      {
        id: 'SKU-007-M',
        sku: 'SKU-007-M',
        name: 'FlexBox Mediano',
        attributes: [{ name: 'Tamano', value: 'Mediano' }],
        prices: [{ currency: 'PEN', amount: 79.9 }],
        inventory: { quantity: 12, inStock: true },
      },
      {
        id: 'SKU-007-L',
        sku: 'SKU-007-L',
        name: 'FlexBox Grande',
        attributes: [{ name: 'Tamano', value: 'Grande' }],
        prices: [{ currency: 'PEN', amount: 99.9 }],
        inventory: { quantity: 9, inStock: true },
      },
    ],
    prices: [{ currency: 'PEN', amount: 59.9 }],
    inventory: { quantity: 36, inStock: true },
    storeAvailability: [
      { storeId: 'store-lima-centro', available: true, quantity: 20 },
      { storeId: 'store-san-isidro', available: true, quantity: 16 },
    ],
    colors: ['Transparente'],
    sizes: ['S', 'M', 'L'],
    price: 59.9,
    currency: 'PEN',
    stock: 36,
    featured: false,
    status: 'active',
  },
  {
    id: 'SKU-003',
    name: 'Set Mancuernas Ajustables 24kg',
    sku: 'SKU-003',
    variantGroup: 'FIT-DB-24',
    description: 'Kit de entrenamiento en casa con ajuste rapido de peso.',
    category: 'deportes',
    categories: ['deportes', 'fitness'],
    imageUrl: 'https://picsum.photos/seed/ecom-dumbbell/900/1200',
    images: [
      'https://picsum.photos/seed/ecom-dumbbell/900/1200',
      'https://picsum.photos/seed/ecom-dumbbell-alt1/900/1200',
    ],
    productType: 'variable',
    attributes: [{ name: 'Peso', values: ['12kg', '18kg', '24kg'] }],
    variants: [
      {
        id: 'SKU-003-12',
        sku: 'SKU-003-12',
        name: 'Set 12kg',
        attributes: [{ name: 'Peso', value: '12kg' }],
        prices: [{ currency: 'PEN', amount: 359.9 }],
        inventory: { quantity: 6, inStock: true },
      },
      {
        id: 'SKU-003-18',
        sku: 'SKU-003-18',
        name: 'Set 18kg',
        attributes: [{ name: 'Peso', value: '18kg' }],
        prices: [{ currency: 'PEN', amount: 449.9 }],
        inventory: { quantity: 5, inStock: true },
      },
      {
        id: 'SKU-003-24',
        sku: 'SKU-003-24',
        name: 'Set 24kg',
        attributes: [{ name: 'Peso', value: '24kg' }],
        prices: [{ currency: 'PEN', amount: 529.9 }],
        inventory: { quantity: 6, inStock: true },
      },
    ],
    prices: [{ currency: 'PEN', amount: 529.9 }],
    inventory: { quantity: 17, inStock: true },
    storeAvailability: [
      { storeId: 'store-lima-centro', available: true, quantity: 10 },
      { storeId: 'store-san-isidro', available: true, quantity: 7 },
    ],
    colors: [],
    sizes: [],
    price: 529.9,
    currency: 'PEN',
    stock: 17,
    featured: false,
    status: 'active',
  },
  {
    id: 'SKU-008',
    name: 'Bicicleta Estatica CardioPro',
    sku: 'SKU-008',
    variantGroup: 'CARDIOPRO',
    description: 'Bicicleta estatica con niveles de resistencia para entrenamientos en casa.',
    category: 'deportes',
    categories: ['deportes', 'fitness'],
    imageUrl: 'https://picsum.photos/seed/ecom-bike/900/1200',
    images: [
      'https://picsum.photos/seed/ecom-bike/900/1200',
      'https://picsum.photos/seed/ecom-bike-alt1/900/1200',
    ],
    productType: 'variable',
    attributes: [
      { name: 'Resistencia', values: ['Basica', 'Intermedia', 'Pro'] },
      { name: 'Color', values: ['Negro'] },
    ],
    variants: [
      {
        id: 'SKU-008-BSC',
        sku: 'SKU-008-BSC',
        name: 'CardioPro Basica',
        attributes: [{ name: 'Resistencia', value: 'Basica' }],
        prices: [{ currency: 'PEN', amount: 899.9 }],
        inventory: { quantity: 5, inStock: true },
      },
      {
        id: 'SKU-008-INT',
        sku: 'SKU-008-INT',
        name: 'CardioPro Intermedia',
        attributes: [{ name: 'Resistencia', value: 'Intermedia' }],
        prices: [{ currency: 'PEN', amount: 1099.9 }],
        inventory: { quantity: 4, inStock: true },
      },
      {
        id: 'SKU-008-PRO',
        sku: 'SKU-008-PRO',
        name: 'CardioPro Pro',
        attributes: [{ name: 'Resistencia', value: 'Pro' }],
        prices: [{ currency: 'PEN', amount: 1299.9 }],
        inventory: { quantity: 3, inStock: true },
      },
    ],
    prices: [{ currency: 'PEN', amount: 899.9 }],
    inventory: { quantity: 12, inStock: true },
    storeAvailability: [
      { storeId: 'store-lima-centro', available: true, quantity: 6 },
      { storeId: 'store-san-isidro', available: true, quantity: 6 },
    ],
    colors: ['Negro'],
    sizes: [],
    price: 899.9,
    currency: 'PEN',
    stock: 12,
    featured: false,
    status: 'active',
  },
  {
    id: 'SKU-009',
    name: 'Raqueta Carbon Strike',
    sku: 'SKU-009',
    variantGroup: 'STRIKE-RKT',
    description: 'Raqueta ligera de carbono para entrenamiento competitivo.',
    category: 'deportes',
    categories: ['deportes', 'raquetas'],
    imageUrl: 'https://picsum.photos/seed/ecom-racket/900/1200',
    images: [
      'https://picsum.photos/seed/ecom-racket/900/1200',
      'https://picsum.photos/seed/ecom-racket-alt1/900/1200',
    ],
    productType: 'variable',
    attributes: [
      { name: 'Grip', values: ['G2', 'G3', 'G4'] },
      { name: 'Color', values: ['Rojo', 'Azul', 'Negro'] },
    ],
    variants: [
      {
        id: 'SKU-009-G2',
        sku: 'SKU-009-G2',
        name: 'Carbon Strike G2',
        attributes: [{ name: 'Grip', value: 'G2' }],
        prices: [{ currency: 'PEN', amount: 459.9 }],
        inventory: { quantity: 9, inStock: true },
      },
      {
        id: 'SKU-009-G3',
        sku: 'SKU-009-G3',
        name: 'Carbon Strike G3',
        attributes: [{ name: 'Grip', value: 'G3' }],
        prices: [{ currency: 'PEN', amount: 479.9 }],
        inventory: { quantity: 8, inStock: true },
      },
      {
        id: 'SKU-009-G4',
        sku: 'SKU-009-G4',
        name: 'Carbon Strike G4',
        attributes: [{ name: 'Grip', value: 'G4' }],
        prices: [{ currency: 'PEN', amount: 499.9 }],
        inventory: { quantity: 7, inStock: true },
      },
    ],
    prices: [{ currency: 'PEN', amount: 459.9 }],
    inventory: { quantity: 24, inStock: true },
    storeAvailability: [
      { storeId: 'store-lima-centro', available: true, quantity: 14 },
      { storeId: 'store-san-isidro', available: true, quantity: 10 },
    ],
    colors: ['Rojo', 'Azul', 'Negro'],
    sizes: [],
    price: 459.9,
    currency: 'PEN',
    stock: 24,
    featured: false,
    status: 'active',
  },
];

export class InMemoryProductRepository extends ProductRepositoryPort {
  constructor() {
    super();
    this.checkoutFrequencyByProductId = new Map();
  }

  getCheckoutFrequency(productId) {
    return this.checkoutFrequencyByProductId.get(productId) ?? 0;
  }

  getFeaturedProductIds() {
    return computeFeaturedProductIds(PRODUCTS, this.checkoutFrequencyByProductId);
  }

  toDomainProduct(product) {
    return new Product(normalizeProductRecord(product));
  }

  async getOptionCatalog() {
    return buildOptionCatalog(PRODUCTS.map(normalizeProductRecord));
  }

  async list(filters = {}) {
    const featuredProductIds = this.getFeaturedProductIds();
    const enrichedProducts = PRODUCTS.map((product) =>
      enrichProduct(product, featuredProductIds, this.checkoutFrequencyByProductId),
    );
    const filteredProducts = applyFilters(enrichedProducts, filters);
    const sortedProducts = sortProducts(filteredProducts);

    return sortedProducts.map((product) => this.toDomainProduct(product));
  }

  async findById(id) {
    const product = PRODUCTS.find((entry) => entry.id === id);
    return product ? this.toDomainProduct(product) : null;
  }

  async create(product) {
    const normalizedProduct = normalizeProductRecord(product);

    const newProduct = {
      ...normalizedProduct,
      id: randomUUID(),
    };

    PRODUCTS.push(newProduct);
    return new Product(newProduct);
  }

  async update(id, product) {
    const index = PRODUCTS.findIndex((entry) => entry.id === id);
    if (index < 0) {
      return null;
    }

    const updatedRecord = {
      ...PRODUCTS[index],
      ...normalizeProductRecord(product),
      id,
    };

    PRODUCTS[index] = updatedRecord;
    return new Product(updatedRecord);
  }

  async registerCheckoutItems(items = []) {
    items.forEach((item) => {
      const currentFrequency = this.getCheckoutFrequency(item.productId);
      this.checkoutFrequencyByProductId.set(item.productId, currentFrequency + item.quantity);
    });
  }
}
