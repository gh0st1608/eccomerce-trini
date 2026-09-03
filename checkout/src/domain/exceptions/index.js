import { HTTP_STATUS } from '../../shared/constants/http-status.js';
import { BaseError } from './BaseError.js';

export class ValidationError extends BaseError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 'VALIDATION_ERROR', HTTP_STATUS.BAD_REQUEST, details);
  }
}

export class BusinessError extends BaseError {
  constructor(message = 'Business rule violation') {
    super(message, 'BUSINESS_ERROR', HTTP_STATUS.BAD_REQUEST);
  }
}

export class NotFoundError extends BaseError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', HTTP_STATUS.NOT_FOUND);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', HTTP_STATUS.UNAUTHORIZED);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', HTTP_STATUS.FORBIDDEN);
  }
}

export class ConflictError extends BaseError {
  constructor(message = 'Conflict') {
    super(message, 'CONFLICT', HTTP_STATUS.CONFLICT);
  }
}

export class InternalServerError extends BaseError {
  constructor(message = 'Internal server error') {
    super(message, 'INTERNAL_SERVER_ERROR', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
