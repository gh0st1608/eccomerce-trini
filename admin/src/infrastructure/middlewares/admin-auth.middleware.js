import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../domain/exceptions/index.js';
import { recordSecurityEvent } from '../../observability/security/record-security-event.js';

export const adminAuthMiddleware = (req, _res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    recordSecurityEvent(req, {
      category: 'authentication',
      action: 'admin_token',
      reason: 'missing_token',
    });
    return next(new UnauthorizedError('Token de autenticacion requerido'));
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();

  if (!token || token !== env.adminAuthToken) {
    recordSecurityEvent(req, {
      category: 'authentication',
      action: 'admin_token',
      reason: 'invalid_token',
    });
    return next(new UnauthorizedError('Token invalido'));
  }

  return next();
};
