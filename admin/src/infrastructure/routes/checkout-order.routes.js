import { Router } from 'express';
import { validateBody } from '../middlewares/validate.middleware.js';
import { checkoutServiceAuthMiddleware } from '../middlewares/checkout-service-auth.middleware.js';
import { createOrderSchema } from '../../shared/validation/order.schema.js';

export const createCheckoutOrderRouter = ({ orderController }) => {
  const router = Router();
  router.post(
    '/orders',
    checkoutServiceAuthMiddleware,
    validateBody(createOrderSchema),
    orderController.createOrder,
  );
  return router;
};