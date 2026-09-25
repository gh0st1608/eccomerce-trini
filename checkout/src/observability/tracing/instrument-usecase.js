import { trace, SpanStatusCode } from '@opentelemetry/api';
import { env } from '../../config/env.js';

const tracer = trace.getTracer(env.otelServiceName);

/**
 * Wraps a use case's `execute` in a dedicated span so New Relic distributed
 * tracing shows time spent in application logic vs. repository/HTTP calls.
 */
export const instrumentUseCase = (name, useCase) => ({
  ...useCase,
  execute: async (...args) =>
    tracer.startActiveSpan(`usecase.${name}`, async (span) => {
      try {
        const result = await useCase.execute(...args);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (err) {
        span.recordException(err);
        span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
        throw err;
      } finally {
        span.end();
      }
    }),
});
