import { Router } from 'express';
import { validateBody } from '../middlewares/validate.middleware.js';
import { createStoreSchema } from '../../shared/validation/store.schema.js';

export const createStoreRouter = ({ storeController }) => {
  const router = Router();
  router.get('/stores', storeController.listStores);
  router.post('/stores', validateBody(createStoreSchema), storeController.createStore);
  router.put('/stores/:id', validateBody(createStoreSchema), storeController.updateStore);
  return router;
};
