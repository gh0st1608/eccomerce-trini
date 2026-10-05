import { context, propagation, trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { env } from '../../config/env.js';
import { isHealthCheckPath } from './health-check-paths.js';

const tracer = trace.getTracer(env.otelServiceName);

const lowercaseKeys = (headers) =>
  Object.fromEntries(
    Object.entries(headers ?? {}).map(([key, value]) => [key.toLowerCase(), value]),
  );

// Supports API Gateway REST (v1) and HTTP API (v2) payloads.
const describeRequest = (event = {}) => ({
  method: event.httpMethod ?? event.requestContext?.http?.method ?? 'UNKNOWN',
  path: event.path ?? event.rawPath ?? '/',
  headers: lowercaseKeys(event.headers),
});

const startServerSpan = ({ method, path, headers }, lambdaContext) =>
  tracer.startSpan(
    method,
    {
      kind: SpanKind.SERVER,
      attributes: {
        'http.request.method': method,
        'url.path': path,
        'faas.invocation_id': lambdaContext?.awsRequestId,
      },
    },
    propagation.extract(context.active(), headers),
  );

const recordResponse = (span, response) => {
  const statusCode = response?.statusCode ?? 200;
  span.setAttribute('http.response.status_code', statusCode);
  if (statusCode >= 500) {
    span.setStatus({ code: SpanStatusCode.ERROR });
  }
};

/**
 * serverless-http never goes through node:http, so the http instrumentation creates no SERVER
 * span (no New Relic transaction) and nothing flushes before Lambda freezes the process.
 * This wrapper opens the SERVER span (continuing an incoming traceparent) and flushes all
 * signals before returning. ServerSpanProcessor names it after the matched express route.
 */
export const instrumentLambdaHandler =
  (handler, { forceFlush }) =>
  async (event, lambdaContext) => {
    const request = describeRequest(event);
    if (isHealthCheckPath(request.path)) {
      return handler(event, lambdaContext);
    }

    const span = startServerSpan(request, lambdaContext);
    try {
      const response = await context.with(trace.setSpan(context.active(), span), () =>
        handler(event, lambdaContext),
      );
      recordResponse(span, response);
      return response;
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      throw err;
    } finally {
      span.end();
      await forceFlush();
    }
  };
