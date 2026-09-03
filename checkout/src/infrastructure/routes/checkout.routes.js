import { Router } from 'express';
import { validateBody } from '../middlewares/validate.middleware.js';
import { checkoutSchema } from '../../shared/validation/checkout.schema.js';

export const createCheckoutRouter = ({ checkoutController }) => {
  const router = Router();
  router.post('/whatsapp', validateBody(checkoutSchema), checkoutController.checkoutByWhatsapp);
  router.get('/share', checkoutController.shareCheckoutPreview);
  router.get('/shared', checkoutController.resolveSharedCheckout);
  return router;
};
