import { env } from './env.js';

export const appConfig = {
  name: env.appName,
  version: env.appVersion,
  env: env.nodeEnv,
};
