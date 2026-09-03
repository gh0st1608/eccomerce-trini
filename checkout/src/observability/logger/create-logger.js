import pino from 'pino';

export const createLogger = ({ appName, environment, level }) =>
  pino({
    level,
    base: { service: appName, environment },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
