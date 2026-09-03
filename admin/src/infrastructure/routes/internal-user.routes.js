import { Router } from 'express';
import { validateBody } from '../middlewares/validate.middleware.js';
import { createInternalUserSchema } from '../../shared/validation/internal-user.schema.js';

export const createInternalUserRouter = ({ internalUserController }) => {
  const router = Router();
  router.get('/internal-users', internalUserController.listInternalUsers);
  router.post(
    '/internal-users',
    validateBody(createInternalUserSchema),
    internalUserController.createInternalUser,
  );
  return router;
};
