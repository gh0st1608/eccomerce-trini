export class BaseError extends Error {
  constructor(message, code, statusCode, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
