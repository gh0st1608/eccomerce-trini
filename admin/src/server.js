import { createContainer } from './container.js';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { telemetryConfig } from './config/telemetry.js';
import { newRelicConfig } from './config/newrelic.js';
import { initTelemetry } from './observability/telemetry/init-telemetry.js';

const { logger, controllers } = createContainer();
initTelemetry({ telemetryConfig, newRelicConfig, logger });

const app = createApp({ logger, controllers });
app.listen(env.port, () => {
  logger.info({ port: env.port }, 'Admin server listening');
});
