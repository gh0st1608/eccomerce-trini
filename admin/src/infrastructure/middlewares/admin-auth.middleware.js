import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../domain/exceptions/index.js';

export const adminAuthMiddleware = (req, _res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de autenticacion requerido'));
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();

  if (!token || token !== env.adminAuthToken) {
    return next(new UnauthorizedError('Token invalido'));
  }

  return next();
};
