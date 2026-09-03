import { ValidationError } from '../../domain/exceptions/index.js';

export const validateBody = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return next(new ValidationError('Invalid request body', parsed.error.flatten()));
  }

  req.body = parsed.data;
  return next();
};
