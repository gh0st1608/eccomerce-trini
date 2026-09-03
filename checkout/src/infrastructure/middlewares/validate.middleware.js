import { ValidationError } from '../../domain/exceptions/index.js';

export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(new ValidationError('Invalid request body', result.error.flatten()));
  }

  req.body = result.data;
  return next();
};
