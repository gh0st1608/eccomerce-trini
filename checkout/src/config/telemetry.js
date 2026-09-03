import { env } from './env.js';

export const telemetryConfig = {
  serviceName: env.otelServiceName,
  otlpEndpoint: env.otelOtlpEndpoint,
  resourceAttributes: env.otelResourceAttributes,
  tracesExporter: env.otelTracesExporter,
  metricsExporter: env.otelMetricsExporter,
  logsExporter: env.otelLogsExporter,
  enableTracing: env.enableTracing,
  enableMetrics: env.enableMetrics,
};
