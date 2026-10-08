import { trace, SpanStatusCode } from '@opentelemetry/api';

/**
 * Failures outside any request (a promise nobody awaited, a throw in a timer) have no span, so
 * they would only show up as a crash in CloudWatch. Report them as an ERROR span + error log
 * and flush before the process goes down.
 *
 * Both handlers end with exit(1), which is Node's default for these events (since v15 an
 * unhandled rejection crashes the process): registering a listener would otherwise silently
 * keep a possibly inconsistent process alive.
 */
export const registerProcessErrorHandlers = ({ serviceName, logger, forceFlush }) => {
  const tracer = trace.getTracer(serviceName);

  const reportAndExit = async (kind, err) => {
    const error = err instanceof Error ? err : new Error(String(err));
    try {
      const span = tracer.startSpan(`process.${kind}`);
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();
      logger.error({ err: error, kind }, `Unhandled ${kind}`);
      await forceFlush();
    } finally {
      process.exit(1);
    }
  };

  process.on('unhandledRejection', (reason) => reportAndExit('unhandledRejection', reason));
  process.on('uncaughtException', (err) => reportAndExit('uncaughtException', err));
};
