import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';

export const initTelemetry = ({ telemetryConfig, newRelicConfig, logger }) => {
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
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${telemetryConfig.otlpEndpoint}/v1/metrics`,
    headers,
  });

  const logExporter = new OTLPLogExporter({
    url: `${telemetryConfig.otlpEndpoint}/v1/logs`,
    headers,
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
