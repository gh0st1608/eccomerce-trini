import { env } from './env.js';

export const newRelicConfig = {
  licenseKey: env.newRelicLicenseKey,
  appName: env.newRelicAppName,
};
