import { Router } from 'express';
import { validateBody } from '../middlewares/validate.middleware.js';
import { createCategorySchema } from '../../shared/validation/category.schema.js';

export const createCategoryRouter = ({ categoryController }) => {
  const router = Router();
  router.post('/categories', validateBody(createCategorySchema), categoryController.createCategory);
  router.put('/categories/:id', validateBody(createCategorySchema), categoryController.updateCategory);
  return router;
};
