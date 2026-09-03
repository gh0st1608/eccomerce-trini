import { successResponse } from '../../shared/utils/response.js';
import { HTTP_STATUS } from '../../shared/constants/http-status.js';

export const createStoreController = ({
  listStoresUseCase,
  createStoreUseCase,
  updateStoreUseCase,
}) => ({
  listStores: async (req, res, next) => {
    try {
      const stores = await listStoresUseCase.execute();
      res.json(
        successResponse({
          data: { stores },
          message: 'Stores listed successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },

  createStore: async (req, res, next) => {
    try {
      const store = await createStoreUseCase.execute(req.body);
      res.status(HTTP_STATUS.CREATED).json(
        successResponse({
          data: { store },
          message: 'Store created successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },

  updateStore: async (req, res, next) => {
    try {
      const store = await updateStoreUseCase.execute(req.params.id, req.body);
      res.json(
        successResponse({
          data: { store },
          message: 'Store updated successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
});
