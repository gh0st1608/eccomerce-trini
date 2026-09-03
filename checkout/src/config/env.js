import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const parseList = (value = '') =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const parseRegexList = (value = '') =>
  parseList(value).map((pattern) => {
    try {
      return new RegExp(pattern);
    } catch {
      throw new Error(`Invalid CORS_ALLOWED_ORIGIN_PATTERNS regex: ${pattern}`);
    }
  });

const required = [
  'PORT',
  'NODE_ENV',
  'APP_NAME',
  'APP_VERSION',
  'LOG_LEVEL',
  'AWS_REGION',
  'NEW_RELIC_APP_NAME',
  'OTEL_SERVICE_NAME',
  'OTEL_EXPORTER_OTLP_ENDPOINT',
  'JWT_SECRET',
  'JWT_EXPIRES',
  'CORS_ALLOWED_ORIGINS',
  'REQUEST_TIMEOUT',
  'ENABLE_METRICS',
  'ENABLE_TRACING',
  'ENABLE_LOGGING',
  'WHATSAPP_PHONE',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV,
  appName: process.env.APP_NAME,
  appVersion: process.env.APP_VERSION,
  logLevel: process.env.LOG_LEVEL,
  awsRegion: process.env.AWS_REGION,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsSessionToken: process.env.AWS_SESSION_TOKEN,
  newRelicLicenseKey: process.env.NEW_RELIC_LICENSE_KEY,
  newRelicAppName: process.env.NEW_RELIC_APP_NAME,
  otelServiceName: process.env.OTEL_SERVICE_NAME,
  otelOtlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  otelResourceAttributes: process.env.OTEL_RESOURCE_ATTRIBUTES,
  otelTracesExporter: process.env.OTEL_TRACES_EXPORTER,
  otelMetricsExporter: process.env.OTEL_METRICS_EXPORTER,
  otelLogsExporter: process.env.OTEL_LOGS_EXPORTER,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpires: process.env.JWT_EXPIRES,
  databaseUrl: process.env.DATABASE_URL,
  corsAllowedOrigins: parseList(process.env.CORS_ALLOWED_ORIGINS),
  corsAllowedOriginPatterns: parseRegexList(process.env.CORS_ALLOWED_ORIGIN_PATTERNS),
  corsAllowNgrok: process.env.CORS_ALLOW_NGROK === 'true',
  corsAllowPrivateNetwork: process.env.CORS_ALLOW_PRIVATE_NETWORK === 'true',
  requestTimeout: Number(process.env.REQUEST_TIMEOUT),
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT ?? '5mb',
  checkoutSharePublicBaseUrl: process.env.CHECKOUT_SHARE_PUBLIC_BASE_URL ?? '',
  lnkUaApiBaseUrl: process.env.LNKUA_API_BASE_URL ?? 'https://lnk.ua',
  lnkUaShortenerPath: process.env.LNKUA_SHORTENER_PATH ?? '/api/v1/link/create',
  lnkUaBearerToken: process.env.LNKUA_BEARER_TOKEN ?? '',
  lnkUaRequestTimeoutMs: Number(process.env.LNKUA_REQUEST_TIMEOUT_MS ?? 3500),
  adminApiBaseUrl: process.env.ADMIN_API_BASE_URL ?? 'http://localhost:3001/api/v1/admin',
  publicApiToken: process.env.PUBLIC_API_TOKEN ?? 'trini-public-readonly-token',
  enableSwagger: process.env.ENABLE_SWAGGER === 'true',
  enableMetrics: process.env.ENABLE_METRICS === 'true',
  enableTracing: process.env.ENABLE_TRACING === 'true',
  enableLogging: process.env.ENABLE_LOGGING === 'true',
  whatsappPhone: process.env.WHATSAPP_PHONE,
};
