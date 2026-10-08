import { metrics } from '@opentelemetry/api';
import { env } from '../../config/env.js';

let checkoutsCreated;

// Lazy: the global MeterProvider is registered by NodeSDK.start().
const recordCheckoutCreated = (payload) => {
  checkoutsCreated ??= metrics
    .getMeter(env.otelServiceName)
    .createCounter('trini.checkouts.created', {
      description: 'WhatsApp checkout links generated (each one persists an order in admin)',
    });
  checkoutsCreated.add(1, { 'delivery.method': payload?.delivery?.method ?? 'unknown' });
};

// Decorates BuildWhatsappCheckoutUseCase so every successful checkout is counted.
export const countCheckoutsCreated = (useCase) => ({
  execute: async (payload, ...rest) => {
    const result = await useCase.execute(payload, ...rest);
    recordCheckoutCreated(payload);
    return result;
  },
});
