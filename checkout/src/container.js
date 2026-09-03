import { createLogger } from './observability/logger/create-logger.js';
import { env } from './config/env.js';
import { HttpAdminProductRepository } from './infrastructure/repositories/HttpAdminProductRepository.js';
import { HttpAdminStoreRepository } from './infrastructure/repositories/HttpAdminStoreRepository.js';
import { WhatsappClient } from './infrastructure/clients/WhatsappClient.js';
import { LnkUaUrlShortenerClient } from './infrastructure/clients/LnkUaUrlShortenerClient.js';
import { WhatsappLinkService } from './domain/services/WhatsappLinkService.js';
import { CheckoutShareLinkService } from './domain/services/CheckoutShareLinkService.js';
import { BuildWhatsappCheckoutUseCase } from './application/usecases/BuildWhatsappCheckoutUseCase.js';
import { ResolveSharedCheckoutUseCase } from './application/usecases/ResolveSharedCheckoutUseCase.js';
import { createCheckoutController } from './infrastructure/controllers/checkout.controller.js';

export const createContainer = ({ overrides = {} } = {}) => {
  const logger = createLogger({
    appName: env.appName,
    environment: env.nodeEnv,
    level: env.logLevel,
  });

  const productRepository =
    overrides.productRepository
    ?? new HttpAdminProductRepository({ baseUrl: env.adminApiBaseUrl, token: env.publicApiToken });
  const storeRepository =
    overrides.storeRepository
    ?? new HttpAdminStoreRepository({ baseUrl: env.adminApiBaseUrl, token: env.publicApiToken });
  const whatsappClient = new WhatsappClient({ whatsappPhone: env.whatsappPhone });
  const urlShortenerClient = new LnkUaUrlShortenerClient({
    baseUrl: env.lnkUaApiBaseUrl,
    shortenPath: env.lnkUaShortenerPath,
    bearerToken: env.lnkUaBearerToken,
    timeoutMs: env.lnkUaRequestTimeoutMs,
  });
  const whatsappLinkService = new WhatsappLinkService({
    whatsappClient,
    urlShortenerClient,
  });
  const checkoutShareLinkService = new CheckoutShareLinkService({
    secret: env.jwtSecret,
    fallbackPublicBaseUrl: env.checkoutSharePublicBaseUrl,
  });

  const buildWhatsappCheckoutUseCase = new BuildWhatsappCheckoutUseCase({
    productRepository,
    storeRepository,
    whatsappLinkService,
    checkoutShareLinkService,
  });
  const resolveSharedCheckoutUseCase = new ResolveSharedCheckoutUseCase({
    checkoutShareLinkService,
  });

  return {
    logger,
    controllers: {
      checkoutController: createCheckoutController({
        buildWhatsappCheckoutUseCase,
        resolveSharedCheckoutUseCase,
        checkoutSharePublicBaseUrl: env.checkoutSharePublicBaseUrl,
      }),
    },
  };
};
