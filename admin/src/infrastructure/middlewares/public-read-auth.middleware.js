import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../domain/exceptions/index.js';

// Accepts either the full admin token or the read-only public token, for GET-only endpoints.
export const publicReadAuthMiddleware = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de autenticacion requerido'));
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();

  if (!token || (token !== env.publicApiToken && token !== env.adminAuthToken)) {
    return next(new UnauthorizedError('Token invalido'));
  }

  // Storefront catalog reads are identical for every visitor: let CloudFront serve them from
  // cache so most page loads never reach (or cold-start) the Lambda. Requests made with the
  // admin token keep the default no-store, so the dashboard always sees fresh data.
  if (token === env.publicApiToken && req.method === 'GET' && env.publicCacheMaxAgeSeconds > 0) {
    res.setHeader('Cache-Control', `public, max-age=${env.publicCacheMaxAgeSeconds}`);
  }

  return next();
};
