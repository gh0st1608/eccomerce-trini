import { trace, SpanStatusCode } from '@opentelemetry/api';
import { recordSpanError } from './record-span-error.js';
import { env } from '../../config/env.js';

const tracer = trace.getTracer(env.otelServiceName);
const INSTRUMENTED = Symbol('instrumentedUseCase');

/**
 * Wraps a use case's `execute` in a dedicated span so New Relic distributed
 * tracing shows time spent in application logic vs. repository/HTTP calls.
 */
export const instrumentUseCase = (name, useCase) =>
  useCase[INSTRUMENTED]
    ? useCase
    : {
        ...useCase,
        [INSTRUMENTED]: true,
        execute: async (...args) =>
          tracer.startActiveSpan(`usecase.${name}`, async (span) => {
            try {
              const result = await useCase.execute(...args);
              span.setStatus({ code: SpanStatusCode.OK });
              return result;
            } catch (err) {
              recordSpanError(span, err);
              throw err;
            } finally {
              span.end();
            }
          }),
      };

/**
 * Instruments every use case handed to a controller, named after its key
 * (listProductsUseCase -> usecase.ListProductsUseCase). Already instrumented ones are kept.
 */
export const instrumentUseCases = (useCases) =>
  Object.fromEntries(
    Object.entries(useCases).map(([key, useCase]) => [
      key,
      instrumentUseCase(key.charAt(0).toUpperCase() + key.slice(1), useCase),
    ]),
  );
