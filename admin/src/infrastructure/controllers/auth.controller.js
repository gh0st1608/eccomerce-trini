import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../domain/exceptions/index.js';
import { successResponse } from '../../shared/utils/response.js';
import { recordSecurityEvent } from '../../observability/security/record-security-event.js';

export const createAuthController = () => ({
  login: async (req, res, next) => {
    try {
      const { username, password } = req.body;

      if (username !== env.adminAuthUsername || password !== env.adminAuthPassword) {
        recordSecurityEvent(req, {
          category: 'authentication',
          action: 'admin_login',
          reason: 'invalid_credentials',
        });
        throw new UnauthorizedError('Credenciales invalidas');
      }

      res.json(
        successResponse({
          data: {
            token: env.adminAuthToken,
          },
          message: 'Login exitoso',
          traceId: req.context.traceId,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
});
