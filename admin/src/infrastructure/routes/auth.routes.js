import { Router } from 'express';
import { validateBody } from '../middlewares/validate.middleware.js';
import { adminAuthLoginSchema } from '../../shared/validation/admin-auth.schema.js';

export const createAuthRouter = ({ authController }) => {
  const router = Router();
  router.post('/login', validateBody(adminAuthLoginSchema), authController.login);
  return router;
};
