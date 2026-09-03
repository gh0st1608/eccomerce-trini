import type { Product } from '@domain/entities/Product'
import type { ProductRepository } from '@application/ports/ProductRepository'

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'TR-001',
    name: 'Chaqueta Atlas',
    description: 'Corte oversized con acabado resistente al agua.',
    category: 'Electronica',
    categories: ['Electronica', 'Moda'],
    imageUrl:
      'https://images.unsplash.com/photo-1484515991647-c5760fcecfc7?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1484515991647-c5760fcecfc7?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1539533018447-63fcce2678e4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80',
    ],
    colors: ['Gris', 'Negro', 'Azul marino'],
    sizes: ['S', 'M', 'L', 'XL'],
    productType: 'variable',
    attributes: [{ name: 'Color', values: ['Gris', 'Negro', 'Azul marino'] }],
    variants: [
      {
        id: 'TR-001-GRIS-S',
        sku: 'TR-001-GRIS-S',
        name: 'Chaqueta Atlas Gris S',
        attributes: [
          { name: 'Color', value: 'Gris' },
          { name: 'Talla', value: 'S' },
        ],
        inventory: { quantity: 8, inStock: true },
        prices: [{ currency: 'PEN', amount: 229.9, originalAmount: 329.9, discountPercent: 30 }],
      },
    ],
    inventory: { quantity: 24, inStock: true },
    prices: [{ currency: 'PEN', amount: 229.9, originalAmount: 329.9, discountPercent: 30 }],
    storeAvailability: [{ storeId: 'store-lima-centro', available: true, quantity: 12 }],
    price: 229.9,
    originalPrice: 329.9,
    discountPercent: 30,
    featured: true,
  },
  {
    id: 'TR-002',
    name: 'Set Eclipse',
    description: 'Top y falda satinada para look nocturno.',
    category: 'Set',
    categories: ['Set', 'Moda'],
    imageUrl:
      'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8f9?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8f9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
    ],
    colors: ['Negro', 'Champagne'],
    sizes: ['XS', 'S', 'M'],
    productType: 'simple',
    attributes: [{ name: 'Color', values: ['Negro', 'Champagne'] }],
    inventory: { quantity: 12, inStock: true },
    prices: [{ currency: 'PEN', amount: 189.5 }],
    storeAvailability: [{ storeId: 'store-lima-centro', available: true, quantity: 6 }],
    price: 189.5,
    featured: true,
  },
  {
    id: 'TR-003',
    name: 'Pantalon Skyline',
    description: 'Silueta recta, tiro alto y textura premium.',
    category: 'Bottoms',
    categories: ['Bottoms', 'Moda'],
    imageUrl:
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80',
    ],
    colors: ['Azul', 'Negro'],
    sizes: ['28', '30', '32', '34'],
    productType: 'simple',
    inventory: { quantity: 20, inStock: true },
    prices: [{ currency: 'PEN', amount: 139 }],
    storeAvailability: [{ storeId: 'store-lima-centro', available: true, quantity: 9 }],
    price: 139,
    featured: true,
  },
  {
    id: 'TR-004',
    name: 'Vestido Nimbus',
    description: 'Vestido midi minimalista con caida ligera.',
    category: 'Dress',
    categories: ['Dress', 'Moda'],
    imageUrl:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
    ],
    colors: ['Vino', 'Arena'],
    sizes: ['S', 'M', 'L'],
    productType: 'simple',
    inventory: { quantity: 15, inStock: true },
    prices: [{ currency: 'PEN', amount: 174.9 }],
    storeAvailability: [{ storeId: 'store-lima-centro', available: true, quantity: 7 }],
    price: 174.9,
    featured: true,
  },
  {
    id: 'TR-005',
    name: 'Bolso Nova',
    description: 'Bolso estructurado para uso diario y oficina.',
    category: 'Accessories',
    categories: ['Accessories', 'Moda'],
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1542291026-ef8f3d3b0c0e?auto=format&fit=crop&w=900&q=80',
    ],
    colors: ['Negro', 'Camel'],
    productType: 'simple',
    inventory: { quantity: 11, inStock: true },
    prices: [{ currency: 'PEN', amount: 96.4 }],
    storeAvailability: [{ storeId: 'store-lima-centro', available: true, quantity: 5 }],
    price: 96.4,
    featured: true,
  },
  {
    id: 'TR-006',
    name: 'Camisa Orbit',
    description: 'Camisa unisex en lino con patron relajado.',
    category: 'Shirts',
    categories: ['Shirts', 'Moda'],
    imageUrl:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
    ],
    colors: ['Blanco', 'Celeste'],
    sizes: ['S', 'M', 'L', 'XL'],
    productType: 'simple',
    inventory: { quantity: 18, inStock: true },
    prices: [{ currency: 'PEN', amount: 89.9 }],
    storeAvailability: [{ storeId: 'store-lima-centro', available: true, quantity: 8 }],
    price: 89.9,
    featured: true,
  },
]

export class InMemoryProductRepository implements ProductRepository {
  async findFeatured(): Promise<Product[]> {
    return MOCK_PRODUCTS.filter((product) => product.featured)
  }

  async findById(id: string): Promise<Product | null> {
    return MOCK_PRODUCTS.find((product) => product.id === id) ?? null
  }
}
