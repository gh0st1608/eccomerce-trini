import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../domain/exceptions/index.js';

export const checkoutServiceAuthMiddleware = (req, _res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Checkout service token required'));
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();
  if (!token || token !== env.checkoutServiceToken) {
    return next(new UnauthorizedError('Invalid checkout service token'));
  }

  return next();
};