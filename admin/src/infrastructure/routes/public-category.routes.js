import { Router } from 'express';

export const createPublicCategoryRouter = ({ categoryController }) => {
  const router = Router();
  router.get('/categories', categoryController.listCategories);
  return router;
};
