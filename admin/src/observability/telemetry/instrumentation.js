// Must be the FIRST import in any entrypoint (server.js/lambda.js), before container.js/app.js,
// so OTel instrumentation hooks register before express/aws-sdk/pino modules are required.
// Nothing imported here may load pino (see bootstrap-logger.js).
import { env } from '../../config/env.js';
import { telemetryConfig } from '../../config/telemetry.js';
import { newRelicConfig } from '../../config/newrelic.js';
import { createBootstrapLogger } from './bootstrap-logger.js';
import { initTelemetry } from './init-telemetry.js';

const bootstrapLogger = createBootstrapLogger({
  appName: env.appName,
  environment: env.nodeEnv,
});

const { sdk, forceFlush } = initTelemetry({
  telemetryConfig,
  newRelicConfig,
  logger: bootstrapLogger,
});

export const telemetrySdk = sdk;
export const flushTelemetry = forceFlush;
