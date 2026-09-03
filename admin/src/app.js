import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import timeout from 'connect-timeout';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { requestContextMiddleware } from './infrastructure/middlewares/request-context.middleware.js';
import { createLoggerMiddleware } from './infrastructure/middlewares/logger.middleware.js';
import { sanitizeMiddleware } from './infrastructure/middlewares/sanitize.middleware.js';
import { errorMiddleware } from './infrastructure/middlewares/error.middleware.js';
import { createProductRouter } from './infrastructure/routes/product.routes.js';
import { createPublicProductRouter } from './infrastructure/routes/public-product.routes.js';
import { createInternalUserRouter } from './infrastructure/routes/internal-user.routes.js';
import { createCategoryRouter } from './infrastructure/routes/category.routes.js';
import { createPublicCategoryRouter } from './infrastructure/routes/public-category.routes.js';
import { createStoreRouter } from './infrastructure/routes/store.routes.js';
import { createPublicStoreRouter } from './infrastructure/routes/public-store.routes.js';
import { createAuthRouter } from './infrastructure/routes/auth.routes.js';
import { createHealthRouter } from './infrastructure/routes/health.routes.js';
import { adminAuthMiddleware } from './infrastructure/middlewares/admin-auth.middleware.js';
import { publicReadAuthMiddleware } from './infrastructure/middlewares/public-read-auth.middleware.js';

const NGROK_FREE_APP_REGEX = /^https:\/\/[a-z0-9-]+\.ngrok-free\.app$/i;

export const createApp = ({ logger, controllers }) => {
  const app = express();
  const isAllowedOrigin = (origin) =>
    env.corsAllowedOrigins.includes(origin)
    || (env.corsAllowNgrok && NGROK_FREE_APP_REGEX.test(origin))
    || env.corsAllowedOriginPatterns.some((pattern) => pattern.test(origin));

  const corsOptions = {
    origin: (origin, callback) => {
      // Allow non-browser requests that don't send Origin (curl, internal checks).
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
  };

  app.disable('x-powered-by');
  app.use(requestContextMiddleware);
  app.use(createLoggerMiddleware(logger));
  app.use(helmet());
  app.use((req, res, next) => {
    if (
      env.corsAllowPrivateNetwork
      && req.headers['access-control-request-private-network'] === 'true'
    ) {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    next();
  });
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(timeout(`${env.requestTimeout}ms`));
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(express.json({ limit: env.requestBodyLimit }));
  app.use(sanitizeMiddleware);

  app.use('/api/v1/admin/auth', createAuthRouter({ authController: controllers.authController }));
  // Public: read-only token (or the full admin token) grants access to these GET-only endpoints.
  app.use(
    '/api/v1/admin',
    publicReadAuthMiddleware,
    createPublicProductRouter({ productController: controllers.productController }),
  );
  app.use(
    '/api/v1/admin',
    publicReadAuthMiddleware,
    createPublicCategoryRouter({ categoryController: controllers.categoryController }),
  );
  app.use(
    '/api/v1/admin',
    publicReadAuthMiddleware,
    createPublicStoreRouter({ publicStoreController: controllers.publicStoreController }),
  );
  app.use(
    '/api/v1/admin',
    adminAuthMiddleware,
    createProductRouter({ productController: controllers.productController }),
  );
  app.use(
    '/api/v1/admin',
    adminAuthMiddleware,
    createInternalUserRouter({ internalUserController: controllers.internalUserController }),
  );
  app.use(
    '/api/v1/admin',
    adminAuthMiddleware,
    createCategoryRouter({ categoryController: controllers.categoryController }),
  );
  app.use(
    '/api/v1/admin',
    adminAuthMiddleware,
    createStoreRouter({ storeController: controllers.storeController }),
  );
  app.use('/', createHealthRouter());

  app.use(errorMiddleware);
  return app;
};
