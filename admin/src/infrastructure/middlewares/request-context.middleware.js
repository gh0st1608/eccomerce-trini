import { context, trace } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';

export const requestContextMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] ?? uuidv4();
  const activeSpan = trace.getSpan(context.active());

  req.context = {
    requestId,
    traceId: activeSpan?.spanContext().traceId ?? 'no-trace',
    spanId: activeSpan?.spanContext().spanId ?? 'no-span',
  };

  res.setHeader('x-request-id', requestId);
  next();
};
