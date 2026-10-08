import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../domain/exceptions/index.js';
import { recordSecurityEvent } from '../../observability/security/record-security-event.js';

export const checkoutServiceAuthMiddleware = (req, _res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    recordSecurityEvent(req, {
      category: 'authentication',
      action: 'checkout_service_token',
      reason: 'missing_token',
    });
    return next(new UnauthorizedError('Checkout service token required'));
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();
  if (!token || token !== env.checkoutServiceToken) {
    recordSecurityEvent(req, {
      category: 'authentication',
      action: 'checkout_service_token',
      reason: 'invalid_token',
    });
    return next(new UnauthorizedError('Invalid checkout service token'));
  }

  return next();
};
