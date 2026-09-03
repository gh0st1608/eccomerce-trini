import { successResponse } from '../../shared/utils/response.js';
import { NotFoundError } from '../../domain/exceptions/index.js';

export const createPublicStoreController = ({ listPickupStoresUseCase, getPickupStoreByIdUseCase }) => ({
  listPickupStores: async (req, res, next) => {
    try {
      const stores = await listPickupStoresUseCase.execute();
      res.json(
        successResponse({
          data: { stores },
          message: 'Pickup stores listed successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },

  getPickupStoreById: async (req, res, next) => {
    try {
      const store = await getPickupStoreByIdUseCase.execute(req.params.id);

      if (!store) {
        throw new NotFoundError('Pickup store not found');
      }

      res.json(
        successResponse({
          data: { store },
          message: 'Pickup store fetched successfully',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
});
