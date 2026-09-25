import { env } from './config/env.js';
import { createLogger } from './observability/logger/create-logger.js';
import { instrumentUseCase } from './observability/tracing/instrument-usecase.js';
import { InMemoryInternalUserRepository } from './infrastructure/repositories/InMemoryInternalUserRepository.js';
import { InMemoryStoreRepository } from './infrastructure/repositories/InMemoryStoreRepository.js';
import { InMemoryProductRepository } from './infrastructure/repositories/InMemoryProductRepository.js';
import { InMemoryCategoryRepository } from './infrastructure/repositories/InMemoryCategoryRepository.js';
import { InMemoryStorefrontSettingsRepository } from './infrastructure/repositories/InMemoryStorefrontSettingsRepository.js';
import { InMemoryOrderRepository } from './infrastructure/repositories/InMemoryOrderRepository.js';
import { DynamoDbInternalUserRepository } from './infrastructure/repositories/DynamoDbInternalUserRepository.js';
import { DynamoDbStoreRepository } from './infrastructure/repositories/DynamoDbStoreRepository.js';
import { DynamoDbProductRepository } from './infrastructure/repositories/DynamoDbProductRepository.js';
import { DynamoDbCategoryRepository } from './infrastructure/repositories/DynamoDbCategoryRepository.js';
import { DynamoDbStorefrontSettingsRepository } from './infrastructure/repositories/DynamoDbStorefrontSettingsRepository.js';
import { DynamoDbOrderRepository } from './infrastructure/repositories/DynamoDbOrderRepository.js';
import { createDynamoDbDocumentClient } from './infrastructure/clients/DynamoDbClientFactory.js';
import { S3ProductImageStorageClient } from './infrastructure/clients/S3ProductImageStorageClient.js';
import { ListProductsUseCase } from './application/usecases/ListProductsUseCase.js';
import { CreateProductUseCase } from './application/usecases/CreateProductUseCase.js';
import { UpdateProductUseCase } from './application/usecases/UpdateProductUseCase.js';
import { DeleteProductUseCase } from './application/usecases/DeleteProductUseCase.js';
import { GetProductByIdUseCase } from './application/usecases/GetProductByIdUseCase.js';
import { RegisterCheckoutItemsUseCase } from './application/usecases/RegisterCheckoutItemsUseCase.js';
import { GetProductOptionsUseCase } from './application/usecases/GetProductOptionsUseCase.js';
import { ListInternalUsersUseCase } from './application/usecases/ListInternalUsersUseCase.js';
import { CreateInternalUserUseCase } from './application/usecases/CreateInternalUserUseCase.js';
import { ListCategoriesUseCase } from './application/usecases/ListCategoriesUseCase.js';
import { CreateCategoryUseCase } from './application/usecases/CreateCategoryUseCase.js';
import { UpdateCategoryUseCase } from './application/usecases/UpdateCategoryUseCase.js';
import { DeleteCategoryUseCase } from './application/usecases/DeleteCategoryUseCase.js';
import { GetStorefrontSettingsUseCase } from './application/usecases/GetStorefrontSettingsUseCase.js';
import { UpdateStorefrontSettingsUseCase } from './application/usecases/UpdateStorefrontSettingsUseCase.js';
import { ListStoresUseCase } from './application/usecases/ListStoresUseCase.js';
import { CreateStoreUseCase } from './application/usecases/CreateStoreUseCase.js';
import { UpdateStoreUseCase } from './application/usecases/UpdateStoreUseCase.js';
import { ListPickupStoresUseCase } from './application/usecases/ListPickupStoresUseCase.js';
import { GetPickupStoreByIdUseCase } from './application/usecases/GetPickupStoreByIdUseCase.js';
import { ListOrdersUseCase } from './application/usecases/ListOrdersUseCase.js';
import { CreateOrderUseCase } from './application/usecases/CreateOrderUseCase.js';
import { UpdateOrderUseCase } from './application/usecases/UpdateOrderUseCase.js';
import { DeleteOrderUseCase } from './application/usecases/DeleteOrderUseCase.js';
import { createProductController } from './infrastructure/controllers/product.controller.js';
import { createInternalUserController } from './infrastructure/controllers/internal-user.controller.js';
import { createCategoryController } from './infrastructure/controllers/category.controller.js';
import { createStorefrontSettingsController } from './infrastructure/controllers/storefront-settings.controller.js';
import { createStoreController } from './infrastructure/controllers/store.controller.js';
import { createPublicStoreController } from './infrastructure/controllers/public-store.controller.js';
import { createAuthController } from './infrastructure/controllers/auth.controller.js';
import { createOrderController } from './infrastructure/controllers/order.controller.js';

export const createContainer = ({ overrides = {} } = {}) => {
  const logger = createLogger({
    appName: env.appName,
    environment: env.nodeEnv,
    level: env.logLevel,
  });

  const dynamoDbDocumentClient =
    env.persistenceDriver === 'dynamodb'
      ? createDynamoDbDocumentClient({ region: env.awsRegion, endpoint: env.dynamoDbEndpoint })
      : null;

  const productRepository =
    overrides.productRepository
    ?? (env.persistenceDriver === 'dynamodb'
      ? new DynamoDbProductRepository({
          documentClient: dynamoDbDocumentClient,
          tableName: env.dynamoDbTableProducts,
        })
      : new InMemoryProductRepository());
  const internalUserRepository =
    overrides.internalUserRepository
    ?? (env.persistenceDriver === 'dynamodb'
      ? new DynamoDbInternalUserRepository({
          documentClient: dynamoDbDocumentClient,
          tableName: env.dynamoDbTableInternalUsers,
        })
      : new InMemoryInternalUserRepository());
  const categoryRepository =
    overrides.categoryRepository
    ?? (env.persistenceDriver === 'dynamodb'
      ? new DynamoDbCategoryRepository({
          documentClient: dynamoDbDocumentClient,
          tableName: env.dynamoDbTableCategories,
        })
      : new InMemoryCategoryRepository());
  const storefrontSettingsRepository =
    overrides.storefrontSettingsRepository
    ?? (env.persistenceDriver === 'dynamodb'
      ? new DynamoDbStorefrontSettingsRepository({
          documentClient: dynamoDbDocumentClient,
          tableName: env.dynamoDbTableStorefrontSettings,
        })
      : new InMemoryStorefrontSettingsRepository());
  const storeRepository =
    overrides.storeRepository
    ?? (env.persistenceDriver === 'dynamodb'
      ? new DynamoDbStoreRepository({
          documentClient: dynamoDbDocumentClient,
          tableName: env.dynamoDbTableStores,
        })
      : new InMemoryStoreRepository());
  const orderRepository =
    overrides.orderRepository
    ?? (env.persistenceDriver === 'dynamodb'
      ? new DynamoDbOrderRepository({
          documentClient: dynamoDbDocumentClient,
          tableName: env.dynamoDbTableOrders,
        })
      : new InMemoryOrderRepository());
  const productImageStorage =
    overrides.productImageStorage
    ?? (env.productImageStorageEnabled
      ? new S3ProductImageStorageClient({
          bucketName: env.s3BucketName,
          region: env.awsRegion,
          endpoint: env.s3Endpoint,
          forcePathStyle: env.s3ForcePathStyle,
          publicBaseUrl: env.s3BucketPublicBaseUrl,
          accessKeyId: env.awsAccessKeyId,
          secretAccessKey: env.awsSecretAccessKey,
          sessionToken: env.awsSessionToken,
        })
      : null);

  // Storefront-facing (public, read) use cases get a dedicated trace span each,
  // so New Relic distributed tracing can pinpoint which one is the bottleneck.
  const listProductsUseCase = instrumentUseCase(
    'ListProductsUseCase',
    new ListProductsUseCase({ productRepository }),
  );
  const createProductUseCase = new CreateProductUseCase({
    productRepository,
    productImageStorage,
  });
  const updateProductUseCase = new UpdateProductUseCase({
    productRepository,
    productImageStorage,
  });
  const deleteProductUseCase = new DeleteProductUseCase({ productRepository });
  const getProductOptionsUseCase = instrumentUseCase(
    'GetProductOptionsUseCase',
    new GetProductOptionsUseCase({ productRepository, categoryRepository, storefrontSettingsRepository }),
  );
  const getProductByIdUseCase = instrumentUseCase(
    'GetProductByIdUseCase',
    new GetProductByIdUseCase({ productRepository }),
  );
  const registerCheckoutItemsUseCase = new RegisterCheckoutItemsUseCase({ productRepository });
  const listInternalUsersUseCase = new ListInternalUsersUseCase({ internalUserRepository });
  const createInternalUserUseCase = new CreateInternalUserUseCase({ internalUserRepository });
  const listCategoriesUseCase = instrumentUseCase(
    'ListCategoriesUseCase',
    new ListCategoriesUseCase({ categoryRepository }),
  );
  const createCategoryUseCase = new CreateCategoryUseCase({ categoryRepository, productImageStorage });
  const updateCategoryUseCase = new UpdateCategoryUseCase({ categoryRepository, productImageStorage });
  const deleteCategoryUseCase = new DeleteCategoryUseCase({ categoryRepository });
  const getStorefrontSettingsUseCase = instrumentUseCase(
    'GetStorefrontSettingsUseCase',
    new GetStorefrontSettingsUseCase({ storefrontSettingsRepository }),
  );
  const updateStorefrontSettingsUseCase = new UpdateStorefrontSettingsUseCase({
    storefrontSettingsRepository,
  });
  const listStoresUseCase = new ListStoresUseCase({ storeRepository });
  const createStoreUseCase = new CreateStoreUseCase({ storeRepository });
  const updateStoreUseCase = new UpdateStoreUseCase({ storeRepository });
  const listPickupStoresUseCase = instrumentUseCase(
    'ListPickupStoresUseCase',
    new ListPickupStoresUseCase({ storeRepository }),
  );
  const getPickupStoreByIdUseCase = instrumentUseCase(
    'GetPickupStoreByIdUseCase',
    new GetPickupStoreByIdUseCase({ storeRepository }),
  );
  const listOrdersUseCase = new ListOrdersUseCase({ orderRepository });
  const createOrderUseCase = new CreateOrderUseCase({ orderRepository });
  const updateOrderUseCase = new UpdateOrderUseCase({ orderRepository });
  const deleteOrderUseCase = new DeleteOrderUseCase({ orderRepository });

  return {
    logger,
    controllers: {
      productController: createProductController({
        listProductsUseCase,
        getProductOptionsUseCase,
        createProductUseCase,
        updateProductUseCase,
        deleteProductUseCase,
        getProductByIdUseCase,
        registerCheckoutItemsUseCase,
      }),
      internalUserController: createInternalUserController({
        listInternalUsersUseCase,
        createInternalUserUseCase,
      }),
      categoryController: createCategoryController({
        listCategoriesUseCase,
        createCategoryUseCase,
        updateCategoryUseCase,
        deleteCategoryUseCase,
      }),
      storefrontSettingsController: createStorefrontSettingsController({
        getStorefrontSettingsUseCase,
        updateStorefrontSettingsUseCase,
      }),
      storeController: createStoreController({
        listStoresUseCase,
        createStoreUseCase,
        updateStoreUseCase,
      }),
      publicStoreController: createPublicStoreController({
        listPickupStoresUseCase,
        getPickupStoreByIdUseCase,
      }),
      authController: createAuthController(),
      orderController: createOrderController({
        listOrdersUseCase,
        createOrderUseCase,
        updateOrderUseCase,
        deleteOrderUseCase,
      }),
    },
  };
};
