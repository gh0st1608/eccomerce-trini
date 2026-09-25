import { metrics } from '@opentelemetry/api';
import { env } from '../../config/env.js';

const meter = metrics.getMeter(env.otelServiceName);

const httpRequestDuration = meter.createHistogram('http.server.duration', {
  description: 'Duration of inbound HTTP requests in milliseconds',
  unit: 'ms',
});

/**
 * Records request duration per route/method/status so New Relic dashboards
 * can surface p50/p95/p99 by endpoint and pinpoint slow routes.
 */
export const httpMetricsMiddleware = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    httpRequestDuration.record(durationMs, {
      'http.method': req.method,
      'http.route': req.route?.path ?? req.path,
      'http.status_code': res.statusCode,
    });
  });

  next();
};
