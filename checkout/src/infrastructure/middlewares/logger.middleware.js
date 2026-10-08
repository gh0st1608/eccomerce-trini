import pinoHttp from 'pino-http';
import { isHealthCheckPath } from '../../observability/telemetry/health-check-paths.js';

// 5xx -> error and 4xx -> warn, so New Relic Logs can be filtered by severity.
export const requestLogLevel = (_req, res, err) => {
  if (err || res.statusCode >= 500) {
    return 'error';
  }
  return res.statusCode >= 400 ? 'warn' : 'info';
};

// pino-http's default relies on res.writableEnded, but serverless-http emits 'finish' before
// setting it, so every Lambda request was logged as "request aborted". headersSent is
// already true by then, and is still false for a client that really disconnected early.
export const requestLogMessage = (_req, res) =>
  res.writableEnded || res.headersSent ? 'request completed' : 'request aborted';

export const createLoggerMiddleware = (logger) =>
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => isHealthCheckPath(req.url) },
    customLogLevel: requestLogLevel,
    customSuccessMessage: requestLogMessage,
    customProps: (req) => ({
      requestId: req.context?.requestId,
      traceId: req.context?.traceId,
      spanId: req.context?.spanId,
    }),
  });
