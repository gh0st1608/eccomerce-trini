import { env } from './env.js';

export const loggerConfig = {
  level: env.logLevel,
  service: env.appName,
  environment: env.nodeEnv,
};
