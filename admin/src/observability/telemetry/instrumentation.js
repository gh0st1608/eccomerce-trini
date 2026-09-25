// Must be the FIRST import in any entrypoint (server.js/lambda.js), before container.js/app.js,
// so OTel auto-instrumentation hooks register before express/aws-sdk modules are required.
import { env } from '../../config/env.js';
import { telemetryConfig } from '../../config/telemetry.js';
import { newRelicConfig } from '../../config/newrelic.js';
import { createLogger } from '../logger/create-logger.js';
import { initTelemetry } from './init-telemetry.js';

const bootstrapLogger = createLogger({
  appName: env.appName,
  environment: env.nodeEnv,
  level: env.logLevel,
});

export const telemetrySdk = initTelemetry({
  telemetryConfig,
  newRelicConfig,
  logger: bootstrapLogger,
});
