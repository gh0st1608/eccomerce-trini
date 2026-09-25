import './observability/telemetry/instrumentation.js';
import serverless from 'serverless-http';
import { createContainer } from './container.js';
import { createApp } from './app.js';

const { logger, controllers } = createContainer();
const app = createApp({ logger, controllers });

export const handler = serverless(app);
