import { env } from './config/env.js';
import { createLogger } from './observability/logger/create-logger.js';
import { InMemoryInternalUserRepository } from './infrastructure/repositories/InMemoryInternalUserRepository.js';
import { InMemoryStoreRepository } from './infrastructure/repositories/InMemoryStoreRepository.js';
import { InMemoryProductRepository } from './infrastructure/repositories/InMemoryProductRepository.js';
import { InMemoryCategoryRepository } from './infrastructure/repositories/InMemoryCategoryRepository.js';
import { DynamoDbInternalUserRepository } from './infrastructure/repositories/DynamoDbInternalUserRepository.js';
import { DynamoDbStoreRepository } from './infrastructure/repositories/DynamoDbStoreRepository.js';
import { DynamoDbProductRepository } from './infrastructure/repositories/DynamoDbProductRepository.js';
import { DynamoDbCategoryRepository } from './infrastructure/repositories/DynamoDbCategoryRepository.js';
import { createDynamoDbDocumentClient } from './infrastructure/clients/DynamoDbClientFactory.js';
import { S3ProductImageStorageClient } from './infrastructure/clients/S3ProductImageStorageClient.js';
import { ListProductsUseCase } from './application/usecases/ListProductsUseCase.js';
import { CreateProductUseCase } from './application/usecases/CreateProductUseCase.js';
import { UpdateProductUseCase } from './application/usecases/UpdateProductUseCase.js';
import { GetProductByIdUseCase } from './application/usecases/GetProductByIdUseCase.js';
import { RegisterCheckoutItemsUseCase } from './application/usecases/RegisterCheckoutItemsUseCase.js';
import { GetProductOptionsUseCase } from './application/usecases/GetProductOptionsUseCase.js';
import { ListInternalUsersUseCase } from './application/usecases/ListInternalUsersUseCase.js';
import { CreateInternalUserUseCase } from './application/usecases/CreateInternalUserUseCase.js';
import { ListCategoriesUseCase } from './application/usecases/ListCategoriesUseCase.js';
import { CreateCategoryUseCase } from './application/usecases/CreateCategoryUseCase.js';
import { UpdateCategoryUseCase } from './application/usecases/UpdateCategoryUseCase.js';
import { ListStoresUseCase } from './application/usecases/ListStoresUseCase.js';
import { CreateStoreUseCase } from './application/usecases/CreateStoreUseCase.js';
import { UpdateStoreUseCase } from './application/usecases/UpdateStoreUseCase.js';
import { ListPickupStoresUseCase } from './application/usecases/ListPickupStoresUseCase.js';
import { GetPickupStoreByIdUseCase } from './application/usecases/GetPickupStoreByIdUseCase.js';
import { createProductController } from './infrastructure/controllers/product.controller.js';
import { createInternalUserController } from './infrastructure/controllers/internal-user.controller.js';
import { createCategoryController } from './infrastructure/controllers/category.controller.js';
import { createStoreController } from './infrastructure/controllers/store.controller.js';
import { createPublicStoreController } from './infrastructure/controllers/public-store.controller.js';
import { createAuthController } from './infrastructure/controllers/auth.controller.js';

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
  const storeRepository =
    overrides.storeRepository
    ?? (env.persistenceDriver === 'dynamodb'
      ? new DynamoDbStoreRepository({
          documentClient: dynamoDbDocumentClient,
          tableName: env.dynamoDbTableStores,
        })
      : new InMemoryStoreRepository());
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

  const listProductsUseCase = new ListProductsUseCase({ productRepository });
  const createProductUseCase = new CreateProductUseCase({
    productRepository,
    productImageStorage,
  });
  const updateProductUseCase = new UpdateProductUseCase({
    productRepository,
    productImageStorage,
  });
  const getProductOptionsUseCase = new GetProductOptionsUseCase({
    productRepository,
    categoryRepository,
  });
  const getProductByIdUseCase = new GetProductByIdUseCase({ productRepository });
  const registerCheckoutItemsUseCase = new RegisterCheckoutItemsUseCase({ productRepository });
  const listInternalUsersUseCase = new ListInternalUsersUseCase({ internalUserRepository });
  const createInternalUserUseCase = new CreateInternalUserUseCase({ internalUserRepository });
  const listCategoriesUseCase = new ListCategoriesUseCase({ categoryRepository });
  const createCategoryUseCase = new CreateCategoryUseCase({ categoryRepository });
  const updateCategoryUseCase = new UpdateCategoryUseCase({ categoryRepository });
  const listStoresUseCase = new ListStoresUseCase({ storeRepository });
  const createStoreUseCase = new CreateStoreUseCase({ storeRepository });
  const updateStoreUseCase = new UpdateStoreUseCase({ storeRepository });
  const listPickupStoresUseCase = new ListPickupStoresUseCase({ storeRepository });
  const getPickupStoreByIdUseCase = new GetPickupStoreByIdUseCase({ storeRepository });

  return {
    logger,
    controllers: {
      productController: createProductController({
        listProductsUseCase,
        getProductOptionsUseCase,
        createProductUseCase,
        updateProductUseCase,
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
    },
  };
};
