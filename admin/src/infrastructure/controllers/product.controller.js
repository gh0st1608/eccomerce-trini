import { successResponse } from '../../shared/utils/response.js';
import { HTTP_STATUS } from '../../shared/constants/http-status.js';
import { NotFoundError, ValidationError } from '../../domain/exceptions/index.js';
import { catalogQuerySchema } from '../../shared/validation/catalog-query.schema.js';

export const createProductController = ({
  listProductsUseCase,
  getProductOptionsUseCase,
  createProductUseCase,
  updateProductUseCase,
  getProductByIdUseCase,
  registerCheckoutItemsUseCase,
}) => ({
  listProducts: async (req, res, next) => {
    try {
      const parsedQuery = catalogQuerySchema.safeParse(req.query ?? {});

      if (!parsedQuery.success) {
        throw new ValidationError('Invalid query parameters', parsedQuery.error.flatten());
      }

      const products = await listProductsUseCase.execute(parsedQuery.data);
      res.json(
        successResponse({
          data: { products },
          message: 'Products listed successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },

  getProductById: async (req, res, next) => {
    try {
      const product = await getProductByIdUseCase.execute(req.params.id);

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      res.json(
        successResponse({
          data: { product },
          message: 'Product fetched successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },

  registerCheckoutItems: async (req, res, next) => {
    try {
      await registerCheckoutItemsUseCase.execute(req.body?.items ?? []);
      res.json(
        successResponse({
          data: {},
          message: 'Checkout items registered successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },

  listProductOptions: async (req, res, next) => {
    try {
      const options = await getProductOptionsUseCase.execute();
      res.json(
        successResponse({
          data: options,
          message: 'Product options fetched successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },

  createProduct: async (req, res, next) => {
    try {
      const product = await createProductUseCase.execute(req.body);
      res.status(HTTP_STATUS.CREATED).json(
        successResponse({
          data: { product },
          message: 'Product created successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },

  updateProduct: async (req, res, next) => {
    try {
      const product = await updateProductUseCase.execute(req.params.id, req.body);
      res.json(
        successResponse({
          data: { product },
          message: 'Product updated successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
});
