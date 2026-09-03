import serverless from 'serverless-http';
import { createContainer } from './container.js';
import { createApp } from './app.js';
import { telemetryConfig } from './config/telemetry.js';
import { newRelicConfig } from './config/newrelic.js';
import { initTelemetry } from './observability/telemetry/init-telemetry.js';

const { logger, controllers } = createContainer();
initTelemetry({ telemetryConfig, newRelicConfig, logger });
const app = createApp({ logger, controllers });

export const handler = serverless(app);
