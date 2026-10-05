import { flushTelemetry } from './observability/telemetry/instrumentation.js';
import serverless from 'serverless-http';
import { instrumentLambdaHandler } from './observability/telemetry/instrument-lambda-handler.js';
import { createContainer } from './container.js';
import { createApp } from './app.js';

const { logger, controllers } = createContainer();
const app = createApp({ logger, controllers });
export const handler = instrumentLambdaHandler(serverless(app), { forceFlush: flushTelemetry });
