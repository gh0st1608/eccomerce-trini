import { Router } from 'express';
import { validateBody } from '../middlewares/validate.middleware.js';
import { updateOrderSchema } from '../../shared/validation/order.schema.js';

export const createOrderRouter = ({ orderController }) => {
  const router = Router();
  router.get('/orders', orderController.listOrders);
  router.put('/orders/:id', validateBody(updateOrderSchema), orderController.updateOrder);
  router.delete('/orders/:id', orderController.deleteOrder);
  return router;
};