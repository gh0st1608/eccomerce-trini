import { successResponse } from '../../shared/utils/response.js';
import { HTTP_STATUS } from '../../shared/constants/http-status.js';

export const createCategoryController = ({
  listCategoriesUseCase,
  createCategoryUseCase,
  updateCategoryUseCase,
}) => ({
  listCategories: async (req, res, next) => {
    try {
      const categories = await listCategoriesUseCase.execute();
      res.json(
        successResponse({
          data: { categories },
          message: 'Categories listed successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },

  createCategory: async (req, res, next) => {
    try {
      const category = await createCategoryUseCase.execute(req.body);
      res.status(HTTP_STATUS.CREATED).json(
        successResponse({
          data: { category },
          message: 'Category created successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },

  updateCategory: async (req, res, next) => {
    try {
      const category = await updateCategoryUseCase.execute(req.params.id, req.body);
      res.json(
        successResponse({
          data: { category },
          message: 'Category updated successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
});
