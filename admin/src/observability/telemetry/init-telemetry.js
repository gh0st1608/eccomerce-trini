import { diag, DiagLogLevel } from '@opentelemetry/api';
import { NodeSDK, tracing } from '@opentelemetry/sdk-node';
// Individual instrumentations instead of @opentelemetry/auto-instrumentations-node: the
// meta-package requires 40+ modules at startup even when disabled, adding ~0.5s to cold starts.
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { RouterInstrumentation } from '@opentelemetry/instrumentation-router';
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { PeriodicExportingMetricReader, AggregationTemporality } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { isHealthCheckPath } from './health-check-paths.js';
import { ServerSpanProcessor } from './server-span-processor.js';

// Surface OTLP export failures (DNS, TLS, auth, etc.) that otherwise fail silently.
const registerDiagLogger = (logger) =>
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

// Kept as references so forceFlush() can drain them before Lambda freezes the process.
const createSignalPipelines = ({ telemetryConfig, newRelicConfig }) => {
  const exporterOptions = (signal) => ({
    url: `${telemetryConfig.otlpEndpoint}/v1/${signal}`,
    headers: newRelicConfig.licenseKey ? { 'api-key': newRelicConfig.licenseKey } : undefined,
    compression: 'gzip',
  });

  return {
    spanProcessor: telemetryConfig.enableTracing
      ? new tracing.BatchSpanProcessor(new OTLPTraceExporter(exporterOptions('traces')))
      : null,
    metricReader: telemetryConfig.enableMetrics
      ? new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({
            ...exporterOptions('metrics'),
            temporalityPreference: AggregationTemporality.DELTA,
          }),
        })
      : null,
    logProcessor: telemetryConfig.enableLogging
      ? // sdk-logs >= 0.2xx takes an options object; a bare exporter silently breaks every export.
        new BatchLogRecordProcessor({ exporter: new OTLPLogExporter(exporterOptions('logs')) })
      : null,
  };
};

const createForceFlush =
  ({ spanProcessor, metricReader, logProcessor }, logger) =>
  async () => {
    const results = await Promise.allSettled([
      spanProcessor?.forceFlush(),
      metricReader?.forceFlush(),
      logProcessor?.forceFlush(),
    ]);
    results
      .filter((result) => result.status === 'rejected')
      .forEach(({ reason }) => logger.error({ err: reason }, 'Telemetry flush failed'));
  };

export const initTelemetry = ({ telemetryConfig, newRelicConfig, logger }) => {
  registerDiagLogger(logger);
  const pipelines = createSignalPipelines({ telemetryConfig, newRelicConfig });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      'service.name': telemetryConfig.serviceName,
      'deployment.environment': process.env.NODE_ENV ?? 'development',
    }),
    // ServerSpanProcessor must run before the batch processor so the route is set before export.
    spanProcessors: pipelines.spanProcessor
      ? [
          new ServerSpanProcessor({ serviceName: telemetryConfig.serviceName }),
          pipelines.spanProcessor,
        ]
      : [],
    metricReader: pipelines.metricReader ?? undefined,
    logRecordProcessors: pipelines.logProcessor ? [pipelines.logProcessor] : [],
    instrumentations: [
      new HttpInstrumentation({
        // Docker healthchecks hit these every few seconds; they would skew throughput/latency/SLIs.
        ignoreIncomingRequestHook: (req) => isHealthCheckPath(req.url),
      }),
      new UndiciInstrumentation(),
      // Express 5 routing is traced by the router instrumentation (not instrumentation-express).
      new RouterInstrumentation(),
      new AwsInstrumentation(),
      new PinoInstrumentation(),
      new RuntimeNodeInstrumentation(),
    ],
  });

  try {
    sdk.start();
  } catch (err) {
    logger.error({ err }, 'Telemetry init failed');
  }

  return { sdk, forceFlush: createForceFlush(pipelines, logger) };
};
