import { metrics } from '@opentelemetry/api';
import { env } from '../../config/env.js';

let ordersCreated;

// Lazy: the global MeterProvider is registered by NodeSDK.start().
export const recordOrderCreated = (order) => {
  ordersCreated ??= metrics.getMeter(env.otelServiceName).createCounter('trini.orders.created', {
    description: 'Orders persisted (checkout WhatsApp flow or checkout service)',
  });
  ordersCreated.add(1, { 'delivery.method': order?.delivery?.method ?? 'unknown' });
};

// Decorates CreateOrderUseCase so every persisted order is counted, whichever route created it.
export const countOrdersCreated = (useCase) => ({
  execute: async (...args) => {
    const order = await useCase.execute(...args);
    recordOrderCreated(order);
    return order;
  },
});
