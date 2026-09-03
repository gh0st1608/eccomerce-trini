import { sanitizeString } from '../../shared/utils/sanitize.js';

const sanitizeObject = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeObject);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeObject(v)]));
  }

  return sanitizeString(value);
};

export const sanitizeMiddleware = (req, _res, next) => {
  req.body = sanitizeObject(req.body);
  req.params = sanitizeObject(req.params);

  if (req.query && typeof req.query === 'object') {
    Object.assign(req.query, sanitizeObject(req.query));
  }

  next();
};
