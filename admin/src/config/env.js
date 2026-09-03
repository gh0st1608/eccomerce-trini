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
  productImageStorageEnabled: process.env.PRODUCT_IMAGE_STORAGE_ENABLED === 'true',
  s3BucketName: process.env.S3_BUCKET_NAME,
  s3BucketPublicBaseUrl: process.env.S3_BUCKET_PUBLIC_BASE_URL,
  s3Endpoint: process.env.S3_ENDPOINT,
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  persistenceDriver: process.env.PERSISTENCE_DRIVER ?? 'memory',
  dynamoDbEndpoint: process.env.DYNAMODB_ENDPOINT,
  dynamoDbTableProducts: process.env.DYNAMODB_TABLE_PRODUCTS,
  dynamoDbTableCategories: process.env.DYNAMODB_TABLE_CATEGORIES,
  dynamoDbTableStores: process.env.DYNAMODB_TABLE_STORES,
  dynamoDbTableInternalUsers: process.env.DYNAMODB_TABLE_INTERNAL_USERS,
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
  adminAuthUsername: process.env.ADMIN_AUTH_USERNAME ?? 'admin',
  adminAuthPassword: process.env.ADMIN_AUTH_PASSWORD ?? 'admin123',
  adminAuthToken: process.env.ADMIN_AUTH_TOKEN ?? 'trini-admin-local-token',
  publicApiToken: process.env.PUBLIC_API_TOKEN ?? 'trini-public-readonly-token',
  databaseUrl: process.env.DATABASE_URL,
  corsAllowedOrigins: parseList(process.env.CORS_ALLOWED_ORIGINS),
  corsAllowedOriginPatterns: parseRegexList(process.env.CORS_ALLOWED_ORIGIN_PATTERNS),
  corsAllowNgrok: process.env.CORS_ALLOW_NGROK === 'true',
  corsAllowPrivateNetwork: process.env.CORS_ALLOW_PRIVATE_NETWORK === 'true',
  requestTimeout: Number(process.env.REQUEST_TIMEOUT),
  requestBodyLimit: process.env.REQUEST_BODY_LIMIT ?? '5mb',
  enableSwagger: process.env.ENABLE_SWAGGER === 'true',
  enableMetrics: process.env.ENABLE_METRICS === 'true',
  enableTracing: process.env.ENABLE_TRACING === 'true',
  enableLogging: process.env.ENABLE_LOGGING === 'true',
};

if (env.productImageStorageEnabled && !env.s3BucketName) {
  throw new Error('Missing env var: S3_BUCKET_NAME when PRODUCT_IMAGE_STORAGE_ENABLED=true');
}

if (
  env.persistenceDriver === 'dynamodb'
  && (!env.dynamoDbTableProducts
    || !env.dynamoDbTableCategories
    || !env.dynamoDbTableStores
    || !env.dynamoDbTableInternalUsers)
) {
  throw new Error(
    'Missing DYNAMODB_TABLE_* env vars when PERSISTENCE_DRIVER=dynamodb',
  );
}
