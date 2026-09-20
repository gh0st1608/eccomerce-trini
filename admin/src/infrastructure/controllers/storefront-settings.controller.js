import { successResponse } from '../../shared/utils/response.js';

export const createStorefrontSettingsController = ({
  getStorefrontSettingsUseCase,
  updateStorefrontSettingsUseCase,
}) => ({
  get: async (req, res, next) => {
    try {
      const settings = await getStorefrontSettingsUseCase.execute();
      res.json(successResponse({ data: { settings }, traceId: req.context.traceId }));
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const settings = await updateStorefrontSettingsUseCase.execute(req.body);
      res.json(successResponse({
        data: { settings },
        message: 'Storefront settings updated successfully',
        traceId: req.context.traceId,
      }));
    } catch (error) {
      next(error);
    }
  },
});