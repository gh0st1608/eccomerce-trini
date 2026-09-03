import { jest } from '@jest/globals';
import { createProductController } from '../../infrastructure/controllers/product.controller.js';
import { createInternalUserController } from '../../infrastructure/controllers/internal-user.controller.js';
import { createCategoryController } from '../../infrastructure/controllers/category.controller.js';
import { createStoreController } from '../../infrastructure/controllers/store.controller.js';
import { createPublicStoreController } from '../../infrastructure/controllers/public-store.controller.js';
import { ValidationError } from '../../domain/exceptions/index.js';

describe('Controllers', () => {
  test('product list returns json', async () => {
    const req = { context: { traceId: 't1' } };
    const res = { json: jest.fn() };
    const controller = createProductController({
      listProductsUseCase: { execute: jest.fn().mockResolvedValue([]) },
      createProductUseCase: { execute: jest.fn() },
      updateProductUseCase: { execute: jest.fn() },
    });

    await controller.listProducts(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledTimes(1);
  });

  test('product options returns json', async () => {
    const req = { context: { traceId: 't1' } };
    const res = { json: jest.fn() };
    const controller = createProductController({
      listProductsUseCase: { execute: jest.fn() },
      getProductOptionsUseCase: {
        execute: jest.fn().mockResolvedValue({
          categories: [{ id: 'cat-1', name: 'Camisas', slug: 'camisas', active: true }],
          colors: ['Negro'],
          sizes: ['M'],
        }),
      },
      createProductUseCase: { execute: jest.fn() },
      updateProductUseCase: { execute: jest.fn() },
    });

    await controller.listProductOptions(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledTimes(1);
  });

  test('internal user create returns status 201', async () => {
    const req = { context: { traceId: 't1' }, body: { name: 'n', email: 'a@a.com', role: 'admin', active: true } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const controller = createInternalUserController({
      listInternalUsersUseCase: { execute: jest.fn() },
      createInternalUserUseCase: { execute: jest.fn().mockResolvedValue({ id: 'x' }) },
    });

    await controller.createInternalUser(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('category create returns status 201', async () => {
    const req = {
      context: { traceId: 't1' },
      body: { name: 'Polos', slug: 'polos', description: '', active: true },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const controller = createCategoryController({
      listCategoriesUseCase: { execute: jest.fn() },
      createCategoryUseCase: { execute: jest.fn().mockResolvedValue({ id: 'cat-x' }) },
      updateCategoryUseCase: { execute: jest.fn() },
    });

    await controller.createCategory(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('product controller forwards errors to next', async () => {
    const req = { context: { traceId: 't1' }, params: { id: 'p1' }, body: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    const next = jest.fn();
    const boom = new Error('boom');
    const controller = createProductController({
      listProductsUseCase: { execute: jest.fn().mockRejectedValue(boom) },
      createProductUseCase: { execute: jest.fn().mockRejectedValue(boom) },
      updateProductUseCase: { execute: jest.fn().mockRejectedValue(boom) },
    });

    await controller.listProducts(req, res, next);
    await controller.createProduct(req, res, next);
    await controller.updateProduct(req, res, next);
    expect(next).toHaveBeenCalledWith(boom);
  });

  test('internal user controller forwards errors to next', async () => {
    const req = { context: { traceId: 't1' }, params: { id: 'c1' }, body: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    const next = jest.fn();
    const boom = new Error('boom');
    const controller = createInternalUserController({
      listInternalUsersUseCase: { execute: jest.fn().mockRejectedValue(boom) },
      createInternalUserUseCase: { execute: jest.fn().mockRejectedValue(boom) },
    });

    await controller.listInternalUsers(req, res, next);
    await controller.createInternalUser(req, res, next);
    expect(next).toHaveBeenCalledWith(boom);
  });

  test('category controller forwards errors to next', async () => {
    const req = { context: { traceId: 't1' }, body: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    const next = jest.fn();
    const boom = new Error('boom');
    const controller = createCategoryController({
      listCategoriesUseCase: { execute: jest.fn().mockRejectedValue(boom) },
      createCategoryUseCase: { execute: jest.fn().mockRejectedValue(boom) },
      updateCategoryUseCase: { execute: jest.fn().mockRejectedValue(boom) },
    });

    await controller.listCategories(req, res, next);
    await controller.createCategory(req, res, next);
    await controller.updateCategory(req, res, next);
    expect(next).toHaveBeenCalledWith(boom);
  });

  test('product update returns json', async () => {
    const req = { context: { traceId: 't1' }, params: { id: 'p1' }, body: { name: 'N' } };
    const res = { json: jest.fn() };
    const controller = createProductController({
      listProductsUseCase: { execute: jest.fn() },
      createProductUseCase: { execute: jest.fn() },
      updateProductUseCase: { execute: jest.fn().mockResolvedValue({ id: 'p1' }) },
    });

    await controller.updateProduct(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledTimes(1);
  });

  test('category update returns json', async () => {
    const req = { context: { traceId: 't1' }, params: { id: 'c1' }, body: { name: 'N' } };
    const res = { json: jest.fn() };
    const controller = createCategoryController({
      listCategoriesUseCase: { execute: jest.fn() },
      createCategoryUseCase: { execute: jest.fn() },
      updateCategoryUseCase: { execute: jest.fn().mockResolvedValue({ id: 'c1' }) },
    });

    await controller.updateCategory(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledTimes(1);
  });

  test('store controller returns json and forwards errors to next', async () => {
    const req = { context: { traceId: 't1' }, params: { id: 's1' }, body: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    const okController = createStoreController({
      listStoresUseCase: { execute: jest.fn().mockResolvedValue([]) },
      createStoreUseCase: { execute: jest.fn().mockResolvedValue({ id: 's1' }) },
      updateStoreUseCase: { execute: jest.fn().mockResolvedValue({ id: 's1' }) },
    });

    await okController.listStores(req, res, jest.fn());
    await okController.createStore(req, res, jest.fn());
    await okController.updateStore(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledTimes(3);

    const next = jest.fn();
    const boom = new Error('boom');
    const failingController = createStoreController({
      listStoresUseCase: { execute: jest.fn().mockRejectedValue(boom) },
      createStoreUseCase: { execute: jest.fn().mockRejectedValue(boom) },
      updateStoreUseCase: { execute: jest.fn().mockRejectedValue(boom) },
    });

    await failingController.listStores(req, res, next);
    await failingController.createStore(req, res, next);
    await failingController.updateStore(req, res, next);
    expect(next).toHaveBeenCalledWith(boom);
  });

  test('public store controller returns json and forwards errors to next', async () => {
    const req = { context: { traceId: 't1' } };
    const res = { json: jest.fn() };
    const okController = createPublicStoreController({
      listPickupStoresUseCase: { execute: jest.fn().mockResolvedValue([]) },
    });

    await okController.listPickupStores(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledTimes(1);

    const next = jest.fn();
    const boom = new Error('boom');
    const failingController = createPublicStoreController({
      listPickupStoresUseCase: { execute: jest.fn().mockRejectedValue(boom) },
    });

    await failingController.listPickupStores(req, res, next);
    expect(next).toHaveBeenCalledWith(boom);
  });

  test('public store controller getPickupStoreById returns json, 404s when missing, and forwards errors', async () => {
    const req = { context: { traceId: 't1' }, params: { id: 'store-001' } };
    const res = { json: jest.fn() };
    const okController = createPublicStoreController({
      getPickupStoreByIdUseCase: { execute: jest.fn().mockResolvedValue({ id: 'store-001' }) },
    });

    await okController.getPickupStoreById(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledTimes(1);

    const notFoundNext = jest.fn();
    const notFoundController = createPublicStoreController({
      getPickupStoreByIdUseCase: { execute: jest.fn().mockResolvedValue(null) },
    });

    await notFoundController.getPickupStoreById(req, res, notFoundNext);
    expect(notFoundNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));

    const next = jest.fn();
    const boom = new Error('boom');
    const failingController = createPublicStoreController({
      getPickupStoreByIdUseCase: { execute: jest.fn().mockRejectedValue(boom) },
    });

    await failingController.getPickupStoreById(req, res, next);
    expect(next).toHaveBeenCalledWith(boom);
  });

  test('product controller rejects invalid query parameters', async () => {
    const req = { context: { traceId: 't1' }, query: { featured: 'maybe' } };
    const res = { json: jest.fn() };
    const next = jest.fn();
    const controller = createProductController({
      listProductsUseCase: { execute: jest.fn() },
      createProductUseCase: { execute: jest.fn() },
      updateProductUseCase: { execute: jest.fn() },
    });

    await controller.listProducts(req, res, next);
    expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
  });

  test('product controller getProductById and registerCheckoutItems return json and forward errors', async () => {
    const req = { context: { traceId: 't1' }, params: { id: 'SKU-001' }, body: { items: [] } };
    const res = { json: jest.fn() };
    const okController = createProductController({
      listProductsUseCase: { execute: jest.fn() },
      createProductUseCase: { execute: jest.fn() },
      updateProductUseCase: { execute: jest.fn() },
      getProductByIdUseCase: { execute: jest.fn().mockResolvedValue({ id: 'SKU-001' }) },
      registerCheckoutItemsUseCase: { execute: jest.fn().mockResolvedValue(undefined) },
    });

    await okController.getProductById(req, res, jest.fn());
    await okController.registerCheckoutItems(req, res, jest.fn());
    expect(res.json).toHaveBeenCalledTimes(2);

    const next = jest.fn();
    const boom = new Error('boom');
    const failingController = createProductController({
      listProductsUseCase: { execute: jest.fn() },
      createProductUseCase: { execute: jest.fn() },
      updateProductUseCase: { execute: jest.fn() },
      getProductByIdUseCase: { execute: jest.fn().mockRejectedValue(boom) },
      registerCheckoutItemsUseCase: { execute: jest.fn().mockRejectedValue(boom) },
      getProductOptionsUseCase: { execute: jest.fn().mockRejectedValue(boom) },
    });

    await failingController.getProductById(req, res, next);
    await failingController.registerCheckoutItems(req, res, next);
    await failingController.listProductOptions(req, res, next);
    expect(next).toHaveBeenCalledWith(boom);
  });
});
