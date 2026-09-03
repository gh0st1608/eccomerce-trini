import { env } from './env.js';

export const serverConfig = {
  port: env.port,
  requestTimeout: env.requestTimeout,
  corsAllowedOrigins: env.corsAllowedOrigins,
};
