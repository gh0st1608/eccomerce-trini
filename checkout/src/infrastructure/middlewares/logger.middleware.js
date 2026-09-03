import pinoHttp from 'pino-http';

export const createLoggerMiddleware = (logger) =>
  pinoHttp({
    logger,
    customProps: (req) => ({
      requestId: req.context?.requestId,
      traceId: req.context?.traceId,
      spanId: req.context?.spanId,
    }),
  });
