import { Router } from 'express';
import { validateBody } from '../middlewares/validate.middleware.js';
import { storefrontSettingsSchema } from '../../shared/validation/storefront-settings.schema.js';

export const createPublicStorefrontSettingsRouter = ({ storefrontSettingsController }) => {
  const router = Router();
  router.get('/storefront-settings', storefrontSettingsController.get);
  return router;
};

export const createStorefrontSettingsRouter = ({ storefrontSettingsController }) => {
  const router = Router();
  router.put(
    '/storefront-settings',
    validateBody(storefrontSettingsSchema),
    storefrontSettingsController.update,
  );
  return router;
};