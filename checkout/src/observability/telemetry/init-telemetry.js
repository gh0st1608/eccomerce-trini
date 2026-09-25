import { diag, DiagLogLevel } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader, AggregationTemporality } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';

export const initTelemetry = ({ telemetryConfig, newRelicConfig, logger }) => {
  // Surface OTLP export failures (DNS, TLS, auth, etc.) that otherwise fail silently.
  diag.setLogger(
    {
      error: (msg, ...args) => logger.error({ args }, `[otel] ${msg}`),
      warn: (msg, ...args) => logger.warn({ args }, `[otel] ${msg}`),
      info: () => {},
      debug: () => {},
      verbose: () => {},
    },
    DiagLogLevel.ERROR,
  );

  const headers = newRelicConfig.licenseKey
    ? { 'api-key': newRelicConfig.licenseKey }
    : undefined;

  const resource = resourceFromAttributes({
    'service.name': telemetryConfig.serviceName,
    'deployment.environment': process.env.NODE_ENV ?? 'development',
  });

  const traceExporter = new OTLPTraceExporter({
    url: `${telemetryConfig.otlpEndpoint}/v1/traces`,
    headers,
    compression: 'gzip',
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${telemetryConfig.otlpEndpoint}/v1/metrics`,
    headers,
    compression: 'gzip',
    temporalityPreference: AggregationTemporality.DELTA,
  });

  const logExporter = new OTLPLogExporter({
    url: `${telemetryConfig.otlpEndpoint}/v1/logs`,
    headers,
    compression: 'gzip',
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader: telemetryConfig.enableMetrics
      ? new PeriodicExportingMetricReader({ exporter: metricExporter })
      : undefined,
    logRecordProcessors: [new BatchLogRecordProcessor(logExporter)],
    instrumentations: [getNodeAutoInstrumentations()],
  });

  try {
    sdk.start();
  } catch (err) {
    logger.error({ err }, 'Telemetry init failed');
  }

  return sdk;
};
