import { Router } from 'express';

export const createPublicProductRouter = ({ productController }) => {
  const router = Router();
  router.get('/products', productController.listProducts);
  router.get('/products/options', productController.listProductOptions);
  router.get('/products/:id', productController.getProductById);
  router.post('/products/register-checkout', productController.registerCheckoutItems);
  return router;
};
