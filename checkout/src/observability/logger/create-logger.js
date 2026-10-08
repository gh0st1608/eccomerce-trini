import { createRequire } from 'node:module';

// Loaded through require() on purpose: @opentelemetry/instrumentation-pino patches pino via
// the CommonJS loader, so an ESM `import pino` gets the unpatched function and logs never
// reach New Relic (no OTLP export, no trace_id/span_id correlation).
const pino = createRequire(import.meta.url)('pino');

// Credentials must never leave the process: pino-http logs every request header, and these
// logs are exported to New Relic.
const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
  '*.password',
  '*.token',
];

export const createLogger = ({ appName, environment, level, destination }) =>
  pino(
    {
      level,
      base: { service: appName, environment },
      timestamp: pino.stdTimeFunctions.isoTime,
      redact: { paths: REDACTED_PATHS, censor: '[REDACTED]' },
    },
    destination,
  );
