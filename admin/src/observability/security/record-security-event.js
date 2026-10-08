import { metrics } from '@opentelemetry/api';
import { env } from '../../config/env.js';

let counter;

/**
 * Security-relevant events (auth failures, CORS rejections, rate limiting) as both:
 *  - a structured warn log (`event.category`/`event.action`), searchable in New Relic Logs, and
 *  - the `trini.security.events` counter, for dashboards and brute-force alerts.
 * Never log the presented token or password: only the reason it was rejected.
 */
export const recordSecurityEvent = (req, { category, action, reason }) => {
  // Lazy: the global MeterProvider is registered by NodeSDK.start().
  counter ??= metrics.getMeter(env.otelServiceName).createCounter('trini.security.events', {
    description: 'Security-relevant request rejections (auth, CORS, rate limit)',
  });
  const route = req.baseUrl ? `${req.baseUrl}${req.route?.path ?? ''}` : req.path;
  counter.add(1, { 'event.category': category, 'event.action': action, 'event.reason': reason });
  req.log?.warn(
    {
      event: { category, action, reason, outcome: 'failure' },
      http: { method: req.method, route },
      client: { ip: req.ip },
    },
    `Security event: ${category}.${action}`,
  );
};

// express-rate-limit `handler`: same 429 response as the default, plus the security event.
export const rateLimitExceededHandler = (req, res, _next, options) => {
  recordSecurityEvent(req, {
    category: 'rate_limit',
    action: 'request_throttled',
    reason: 'too_many_requests',
  });
  res.status(options.statusCode).send(options.message);
};
