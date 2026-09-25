import './observability/telemetry/instrumentation.js';
import { createContainer } from './container.js';
import { createApp } from './app.js';
import { env } from './config/env.js';

const { logger, controllers } = createContainer();
const app = createApp({ logger, controllers });
app.listen(env.port, () => {
  logger.info({ port: env.port }, 'Admin server listening');
});
