locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  # Mirrors gateway/nginx.conf's routing contract:
  #   /api/v1/admin/*  -> admin-api
  #   /api/v1/*        -> ecommerce-api
  #   /*               -> frontend (static assets)
  product_images_bucket_name = "${local.name_prefix}-product-images-2026"
  frontend_bucket_name       = "${local.name_prefix}-frontend-2026"

  # Service names as shown in New Relic APM & Services (one entity per service and environment).
  checkout_service_name = "checkout-trini-backend-${var.service_name_suffix}"
  admin_service_name    = "admin-trini-backend-${var.service_name_suffix}"

  # OpenTelemetry tuning shared by both Lambdas.
  otel_lambda_environment = {
    # Telemetry is flushed before each response; cap export time so a slow New Relic
    # endpoint can't eat into lambda_timeout.
    OTEL_EXPORTER_OTLP_TIMEOUT = "3000"
    # Load only the instrumentations the services use (shorter cold start).
    OTEL_NODE_ENABLED_INSTRUMENTATIONS = "http,undici,router,express,aws-sdk,pino,runtime-node"
    # Adds cloud.region, faas.name, etc. to the resource.
    OTEL_NODE_RESOURCE_DETECTORS = "env,host,process,aws"
  }
}
