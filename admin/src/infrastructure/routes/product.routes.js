import { Router } from 'express';
import { validateBody } from '../middlewares/validate.middleware.js';
import { createProductSchema } from '../../shared/validation/product.schema.js';

export const createProductRouter = ({ productController }) => {
  const router = Router();
  router.post('/products', validateBody(createProductSchema), productController.createProduct);
  router.put('/products/:id', validateBody(createProductSchema), productController.updateProduct);
  return router;
};
