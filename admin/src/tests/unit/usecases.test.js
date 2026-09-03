import { jest } from '@jest/globals';
import { ListProductsUseCase } from '../../application/usecases/ListProductsUseCase.js';
import { CreateProductUseCase } from '../../application/usecases/CreateProductUseCase.js';
import { ListInternalUsersUseCase } from '../../application/usecases/ListInternalUsersUseCase.js';
import { CreateInternalUserUseCase } from '../../application/usecases/CreateInternalUserUseCase.js';
import { ListCategoriesUseCase } from '../../application/usecases/ListCategoriesUseCase.js';
import { CreateCategoryUseCase } from '../../application/usecases/CreateCategoryUseCase.js';
import { UpdateProductUseCase } from '../../application/usecases/UpdateProductUseCase.js';
import { UpdateCategoryUseCase } from '../../application/usecases/UpdateCategoryUseCase.js';
import { CreateStoreUseCase } from '../../application/usecases/CreateStoreUseCase.js';
import { UpdateStoreUseCase } from '../../application/usecases/UpdateStoreUseCase.js';
import { GetProductOptionsUseCase } from '../../application/usecases/GetProductOptionsUseCase.js';
import { GetProductByIdUseCase } from '../../application/usecases/GetProductByIdUseCase.js';
import { RegisterCheckoutItemsUseCase } from '../../application/usecases/RegisterCheckoutItemsUseCase.js';
import { BusinessError, NotFoundError } from '../../domain/exceptions/index.js';

describe('UseCases', () => {
  const pngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3z4xkAAAAASUVORK5CYII=';

  test('list products', async () => {
    const productRepository = { list: jest.fn().mockResolvedValue([{ id: '1' }]) };
    const useCase = new ListProductsUseCase({ productRepository });
    const result = await useCase.execute();
    expect(result.length).toBe(1);
  });

  test('list products forwards filters to repository', async () => {
    const productRepository = { list: jest.fn().mockResolvedValue([{ id: '1' }]) };
    const useCase = new ListProductsUseCase({ productRepository });
    const filters = { category: 'camisetas', maxPrice: 120, featured: true };

    await useCase.execute(filters);

    expect(productRepository.list).toHaveBeenCalledWith(filters);
  });

  test('get product by id forwards id to repository', async () => {
    const findById = jest.fn().mockResolvedValue({ id: 'SKU-001' });
    const useCase = new GetProductByIdUseCase({ productRepository: { findById } });

    const result = await useCase.execute('SKU-001');

    expect(result).toEqual({ id: 'SKU-001' });
    expect(findById).toHaveBeenCalledWith('SKU-001');
  });

  test('register checkout items forwards items to repository', async () => {
    const registerCheckoutItems = jest.fn().mockResolvedValue(undefined);
    const useCase = new RegisterCheckoutItemsUseCase({
      productRepository: { registerCheckoutItems },
    });
    const items = [{ productId: 'SKU-001', quantity: 2 }];

    await useCase.execute(items);

    expect(registerCheckoutItems).toHaveBeenCalledWith(items);
  });

  test('get product options combines repository and categories', async () => {
    const useCase = new GetProductOptionsUseCase({
      productRepository: {
        getOptionCatalog: jest.fn().mockResolvedValue({
          colors: ['Negro', 'Azul'],
          sizes: ['S', 'M'],
        }),
      },
      categoryRepository: {
        list: jest.fn().mockResolvedValue([{ id: 'cat-1', name: 'Camisas', slug: 'camisas', active: true }]),
      },
    });

    const result = await useCase.execute();
    expect(result.colors).toContain('Negro');
    expect(result.sizes).toContain('M');
    expect(result.categories[0].slug).toBe('camisas');
  });

  test('create product business rule', async () => {
    const useCase = new CreateProductUseCase({
      productRepository: { create: jest.fn() },
    });
    await expect(
      useCase.execute({ name: 'A', sku: 'A', price: 1, currency: 'PEN', stock: -1, status: 'active' }),
    ).rejects.toBeInstanceOf(BusinessError);
  });

  test('create product uploads data URL images before repository create', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'p1' });
    const uploadDataUrl = jest
      .fn()
      .mockResolvedValueOnce('https://cdn.example.com/products/main.jpg')
      .mockResolvedValueOnce('https://cdn.example.com/products/gallery.jpg')
      .mockResolvedValueOnce('https://cdn.example.com/products/variant.jpg');

    const useCase = new CreateProductUseCase({
      productRepository: { create },
      productImageStorage: { uploadDataUrl },
    });

    await useCase.execute({
      name: 'Polo Tech',
      sku: 'PL-TECH-01',
      description: '',
      category: 'polos',
      imageUrl: pngDataUrl,
      images: [pngDataUrl],
      variants: [{ sku: 'PL-TECH-01-BLK', imageUrl: pngDataUrl }],
      price: 10,
      currency: 'PEN',
      stock: 1,
      featured: false,
      status: 'active',
    });

    expect(uploadDataUrl).toHaveBeenCalledTimes(3);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        imageUrl: 'https://cdn.example.com/products/main.jpg',
        images: ['https://cdn.example.com/products/gallery.jpg'],
      }),
    );
    expect(create.mock.calls[0][0].variants[0].imageUrl).toBe(
      'https://cdn.example.com/products/variant.jpg',
    );
  });

  test('list internal users', async () => {
    const internalUserRepository = { list: jest.fn().mockResolvedValue([{ id: 'u1' }]) };
    const useCase = new ListInternalUsersUseCase({ internalUserRepository });
    const result = await useCase.execute();
    expect(result.length).toBe(1);
  });

  test('create internal user rejects invalid role', async () => {
    const useCase = new CreateInternalUserUseCase({
      internalUserRepository: { create: jest.fn() },
    });

    await expect(
      useCase.execute({ name: 'x', email: 'x@x.com', role: 'customer', active: true }),
    ).rejects.toBeInstanceOf(BusinessError);
  });

  test('list categories', async () => {
    const categoryRepository = { list: jest.fn().mockResolvedValue([{ id: 'cat-1' }]) };
    const useCase = new ListCategoriesUseCase({ categoryRepository });
    const result = await useCase.execute();
    expect(result.length).toBe(1);
  });

  test('create category rejects invalid slug', async () => {
    const useCase = new CreateCategoryUseCase({
      categoryRepository: {
        findBySlug: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    });

    await expect(
      useCase.execute({ name: 'Polos', slug: 'Polos Invalid', description: '', active: true }),
    ).rejects.toBeInstanceOf(BusinessError);
  });

  test('create category rejects duplicated slug', async () => {
    const useCase = new CreateCategoryUseCase({
      categoryRepository: {
        findBySlug: jest.fn().mockResolvedValue({ id: 'cat-existing' }),
        create: jest.fn(),
      },
    });

    await expect(
      useCase.execute({ name: 'Polos', slug: 'polos', description: '', active: true }),
    ).rejects.toBeInstanceOf(BusinessError);
  });

  test('update product rejects when product does not exist', async () => {
    const useCase = new UpdateProductUseCase({
      productRepository: {
        findById: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    });

    await expect(
      useCase.execute('missing-product', {
        name: 'Polo',
        sku: 'PL-01',
        description: '',
        category: 'polos',
        imageUrl: 'https://picsum.photos/900/1200',
        price: 10,
        currency: 'PEN',
        stock: 1,
        featured: false,
        status: 'active',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test('update product rejects negative stock', async () => {
    const useCase = new UpdateProductUseCase({
      productRepository: {
        findById: jest.fn(),
        update: jest.fn(),
      },
    });

    await expect(
      useCase.execute('product-1', {
        name: 'Polo',
        sku: 'PL-01',
        description: '',
        category: 'polos',
        imageUrl: 'https://picsum.photos/900/1200',
        price: 10,
        currency: 'PEN',
        stock: -2,
        featured: false,
        status: 'active',
      }),
    ).rejects.toBeInstanceOf(BusinessError);
  });

  test('update product uploads only new data URL images', async () => {
    const update = jest.fn().mockResolvedValue({ id: 'product-1' });
    const uploadDataUrl = jest
      .fn()
      .mockResolvedValueOnce('https://cdn.example.com/products/main-updated.jpg');

    const useCase = new UpdateProductUseCase({
      productRepository: {
        findById: jest.fn().mockResolvedValue({ id: 'product-1' }),
        update,
      },
      productImageStorage: { uploadDataUrl },
    });

    await useCase.execute('product-1', {
      name: 'Polo',
      sku: 'PL-01',
      description: '',
      category: 'polos',
      imageUrl: pngDataUrl,
      images: ['https://existing.example.com/image-1.jpg'],
      variants: [{ sku: 'PL-01-BLK', imageUrl: 'https://existing.example.com/variant.jpg' }],
      price: 10,
      currency: 'PEN',
      stock: 2,
      featured: false,
      status: 'active',
    });

    expect(uploadDataUrl).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(
      'product-1',
      expect.objectContaining({
        imageUrl: 'https://cdn.example.com/products/main-updated.jpg',
        images: ['https://existing.example.com/image-1.jpg'],
      }),
    );
  });

  test('update category rejects invalid slug and duplicated slug', async () => {
    const useCase = new UpdateCategoryUseCase({
      categoryRepository: {
        findById: jest.fn().mockResolvedValue({ id: 'cat-1' }),
        findBySlug: jest.fn().mockResolvedValue({ id: 'cat-2' }),
        update: jest.fn(),
      },
    });

    await expect(
      useCase.execute('cat-1', { name: 'Polos', slug: 'Polos Invalid', description: '', active: true }),
    ).rejects.toBeInstanceOf(BusinessError);

    await expect(
      useCase.execute('cat-1', { name: 'Polos', slug: 'camisas', description: '', active: true }),
    ).rejects.toBeInstanceOf(BusinessError);
  });

  test('update category rejects when category does not exist', async () => {
    const useCase = new UpdateCategoryUseCase({
      categoryRepository: {
        findById: jest.fn().mockResolvedValue(null),
        findBySlug: jest.fn(),
        update: jest.fn(),
      },
    });

    await expect(
      useCase.execute('missing-category', {
        name: 'Polos',
        slug: 'polos',
        description: '',
        active: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test('create store rejects invalid slug and disabled methods', async () => {
    const useCase = new CreateStoreUseCase({
      storeRepository: {
        findBySlug: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    });

    await expect(
      useCase.execute({
        name: 'Store A',
        slug: 'Store Invalid',
        address: 'Av. Demo 100',
        district: 'Miraflores',
        reference: '',
        pickupEnabled: true,
        courierEnabled: true,
        active: true,
      }),
    ).rejects.toBeInstanceOf(BusinessError);

    await expect(
      useCase.execute({
        name: 'Store B',
        slug: 'store-b',
        address: 'Av. Demo 200',
        district: 'San Isidro',
        reference: '',
        pickupEnabled: false,
        courierEnabled: false,
        active: true,
      }),
    ).rejects.toBeInstanceOf(BusinessError);
  });

  test('create store rejects duplicated slug', async () => {
    const useCase = new CreateStoreUseCase({
      storeRepository: {
        findBySlug: jest.fn().mockResolvedValue({ id: 'store-existing' }),
        create: jest.fn(),
      },
    });

    await expect(
      useCase.execute({
        name: 'Store C',
        slug: 'store-c',
        address: 'Av. Demo 300',
        district: 'Surco',
        reference: '',
        pickupEnabled: true,
        courierEnabled: true,
        active: true,
      }),
    ).rejects.toBeInstanceOf(BusinessError);
  });

  test('create store persists valid payload', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'store-1' });
    const payload = {
      name: 'Store D',
      slug: 'store-d',
      address: 'Av. Demo 400',
      district: 'La Molina',
      reference: 'Tienda principal',
      pickupEnabled: true,
      courierEnabled: false,
      active: true,
    };

    const useCase = new CreateStoreUseCase({
      storeRepository: {
        findBySlug: jest.fn().mockResolvedValue(null),
        create,
      },
    });

    await useCase.execute(payload);
    expect(create).toHaveBeenCalledWith(payload);
  });

  test('update store validates not found, duplicate slug and success path', async () => {
    const updateUseCaseNotFound = new UpdateStoreUseCase({
      storeRepository: {
        findById: jest.fn().mockResolvedValue(null),
        findBySlug: jest.fn(),
        update: jest.fn(),
      },
    });

    await expect(
      updateUseCaseNotFound.execute('missing-store', {
        name: 'Store X',
        slug: 'store-x',
        address: 'Av. Demo 500',
        district: 'Miraflores',
        reference: '',
        pickupEnabled: true,
        courierEnabled: true,
        active: true,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);

    const updateUseCaseDuplicate = new UpdateStoreUseCase({
      storeRepository: {
        findById: jest.fn().mockResolvedValue({ id: 'store-1' }),
        findBySlug: jest.fn().mockResolvedValue({ id: 'store-2' }),
        update: jest.fn(),
      },
    });

    await expect(
      updateUseCaseDuplicate.execute('store-1', {
        name: 'Store X',
        slug: 'store-duplicate',
        address: 'Av. Demo 600',
        district: 'San Borja',
        reference: '',
        pickupEnabled: true,
        courierEnabled: true,
        active: true,
      }),
    ).rejects.toBeInstanceOf(BusinessError);

    const update = jest.fn().mockResolvedValue({ id: 'store-1' });
    const payload = {
      name: 'Store Updated',
      slug: 'store-updated',
      address: 'Av. Demo 700',
      district: 'Barranco',
      reference: 'Actualizada',
      pickupEnabled: true,
      courierEnabled: true,
      active: true,
    };
    const updateUseCaseSuccess = new UpdateStoreUseCase({
      storeRepository: {
        findById: jest.fn().mockResolvedValue({ id: 'store-1' }),
        findBySlug: jest.fn().mockResolvedValue({ id: 'store-1' }),
        update,
      },
    });

    await updateUseCaseSuccess.execute('store-1', payload);
    expect(update).toHaveBeenCalledWith('store-1', payload);
  });

  test('update store rejects invalid slug and disabled delivery modes', async () => {
    const useCase = new UpdateStoreUseCase({
      storeRepository: {
        findById: jest.fn().mockResolvedValue({ id: 'store-1' }),
        findBySlug: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    });

    await expect(
      useCase.execute('store-1', {
        name: 'Store X',
        slug: 'Store Invalid',
        address: 'Av. Demo 1',
        district: 'Lima',
        reference: '',
        pickupEnabled: true,
        courierEnabled: true,
        active: true,
      }),
    ).rejects.toBeInstanceOf(BusinessError);

    await expect(
      useCase.execute('store-1', {
        name: 'Store X',
        slug: 'store-x',
        address: 'Av. Demo 1',
        district: 'Lima',
        reference: '',
        pickupEnabled: false,
        courierEnabled: false,
        active: true,
      }),
    ).rejects.toBeInstanceOf(BusinessError);
  });
});
