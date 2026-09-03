import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../domain/exceptions/index.js';

// Accepts either the full admin token or the read-only public token, for GET-only endpoints.
export const publicReadAuthMiddleware = (req, _res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de autenticacion requerido'));
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();

  if (!token || (token !== env.publicApiToken && token !== env.adminAuthToken)) {
    return next(new UnauthorizedError('Token invalido'));
  }

  return next();
};
