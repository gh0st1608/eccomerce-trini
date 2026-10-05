import { metrics, SpanKind } from '@opentelemetry/api';

const hrTimeToMs = ([seconds, nanos]) => seconds * 1e3 + nanos / 1e6;
const parentSpanIdOf = (span) => span.parentSpanContext?.spanId ?? span.parentSpanId;
const pick = (attributes, ...keys) =>
  keys.map((key) => attributes[key]).find((v) => v !== undefined);

/**
 * Express 5 is traced by @opentelemetry/instrumentation-router, which puts the matched route only
 * on its own "request handler" span. New Relic names transactions after the SERVER span, so
 * without this every transaction would be just "GET"/"POST". This processor copies the route up
 * to the parent SERVER span and, when that span ends, records the request duration metric.
 * Works for both node:http (local/Docker) and the Lambda wrapper SERVER spans.
 */
export class ServerSpanProcessor {
  #serverSpans = new Map();
  #histogram;
  #serviceName;

  constructor({ serviceName }) {
    this.#serviceName = serviceName;
  }

  onStart(span) {
    if (span.kind === SpanKind.SERVER) {
      this.#serverSpans.set(span.spanContext().spanId, span);
    }
  }

  onEnd(span) {
    if (span.kind === SpanKind.SERVER) {
      this.#serverSpans.delete(span.spanContext().spanId);
      this.#recordDuration(span);
      return;
    }

    const route = span.attributes['http.route'];
    const serverSpan = this.#serverSpans.get(parentSpanIdOf(span));
    if (span.attributes['router.type'] !== 'request_handler' || !route || !serverSpan) {
      return;
    }
    const method = pick(serverSpan.attributes, 'http.request.method', 'http.method');
    serverSpan.setAttribute('http.route', route);
    serverSpan.updateName(`${method} ${route}`);
  }

  #recordDuration(span) {
    // Lazy: the global MeterProvider is only registered once NodeSDK.start() runs.
    this.#histogram ??= metrics
      .getMeter(this.#serviceName)
      .createHistogram('trini.http.server.duration', {
        description: 'Duration of inbound HTTP requests in milliseconds',
        unit: 'ms',
      });

    this.#histogram.record(hrTimeToMs(span.duration), {
      'http.method': pick(span.attributes, 'http.request.method', 'http.method'),
      'http.route': span.attributes['http.route'] ?? 'unmatched',
      'http.status_code': pick(span.attributes, 'http.response.status_code', 'http.status_code'),
    });
  }

  forceFlush() {
    return Promise.resolve();
  }

  shutdown() {
    this.#serverSpans.clear();
    return Promise.resolve();
  }
}
