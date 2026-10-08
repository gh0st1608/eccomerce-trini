import { SpanStatusCode } from '@opentelemetry/api';
import { BaseError } from '../../domain/exceptions/BaseError.js';

// Client errors the API answers on purpose (validation, not found, auth, CORS, body too large).
export const isExpectedError = (err) =>
  (err instanceof BaseError && err.statusCode < 500) ||
  err?.message === 'Not allowed by CORS' ||
  err?.type === 'entity.too.large';

/**
 * Only unexpected failures mark the span as ERROR and record the exception, so New Relic's
 * Errors inbox and error rate reflect real faults instead of every 404/400/401. Expected
 * errors stay visible through attributes (filterable in traces) without counting as errors.
 */
export const recordSpanError = (span, err) => {
  if (!span) {
    return;
  }
  if (isExpectedError(err)) {
    span.setAttribute('error.expected', true);
    span.setAttribute('error.type', err.code ?? err.type ?? err.name ?? 'Error');
    return;
  }
  span.recordException(err);
  span.setStatus({ code: SpanStatusCode.ERROR, message: err?.message });
};
