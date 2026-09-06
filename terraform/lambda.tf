# Both zips are produced by `npm run build` in each service (see
# ecommerce/scripts/build-lambda.mjs and admin/scripts/build-lambda.mjs), which
# runs `npm prune --omit=dev` and tars src/ + package.json + package-lock.json.
# Run `terraform/scripts/build-lambdas.ps1` (or .sh) before `terraform apply`,
# exactly like the "Build -> Package Lambda -> Deploy" steps already used in CI.

# =============================================================================
# ECOMMERCE API LAMBDA
# =============================================================================

resource "aws_cloudwatch_log_group" "checkout_lambda" {
  name              = "/aws/lambda/${local.name_prefix}-checkout-api"
  retention_in_days = var.log_retention_in_days
}

resource "aws_lambda_function" "checkout_api" {
  function_name = "${local.name_prefix}-checkout-api"
  role          = aws_iam_role.checkout_lambda.arn
  handler       = "src/lambda.handler"
  runtime       = var.lambda_runtime
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  filename = "${var.checkout_source_dir}/dist/lambda.zip"
  source_code_hash = filebase64sha256(
    "${var.checkout_source_dir}/dist/lambda.zip"
  )

  depends_on = [
    aws_cloudwatch_log_group.checkout_lambda
  ]

  environment {
    variables = {
      PORT        = "3000"
      NODE_ENV    = var.environment == "local" ? "development" : "production"
      APP_NAME    = "checkout-trini-backend"
      APP_VERSION = "1.0.0"

      # Logging / observability
      LOG_LEVEL                   = var.log_level
      NEW_RELIC_APP_NAME          = "checkout-trini-backend"
      NEW_RELIC_LICENSE_KEY       = var.new_relic_license_key
      OTEL_SERVICE_NAME           = "checkout-trini-backend"
      OTEL_EXPORTER_OTLP_ENDPOINT = var.otel_exporter_otlp_endpoint

      # Application
      JWT_SECRET           = var.jwt_secret
      JWT_EXPIRES          = var.jwt_expires
      CORS_ALLOWED_ORIGINS = var.cors_allowed_origins
      REQUEST_TIMEOUT      = tostring(var.request_timeout_ms)

      # Observability flags
      ENABLE_METRICS = "true"
      ENABLE_TRACING = "true"
      ENABLE_LOGGING = "true"

      # Checkout / integrations
      WHATSAPP_PHONE                 = var.whatsapp_phone
      CHECKOUT_SHARE_PUBLIC_BASE_URL = var.checkout_share_public_base_url
      LNKUA_BEARER_TOKEN             = var.lnkua_bearer_token
      ADMIN_API_BASE_URL             = var.admin_api_base_url
      PUBLIC_API_TOKEN               = var.public_api_token
    }
  }
}


# =============================================================================
# ADMIN API LAMBDA
# =============================================================================

resource "aws_cloudwatch_log_group" "admin_lambda" {
  name              = "/aws/lambda/${local.name_prefix}-admin-api"
  retention_in_days = var.log_retention_in_days
}

resource "aws_lambda_function" "admin_api" {
  function_name = "${local.name_prefix}-admin-api"
  role          = aws_iam_role.admin_lambda.arn
  handler       = "src/lambda.handler"
  runtime       = var.lambda_runtime
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  filename = "${var.admin_source_dir}/dist/lambda.zip"
  source_code_hash = filebase64sha256(
    "${var.admin_source_dir}/dist/lambda.zip"
  )

  depends_on = [
    aws_cloudwatch_log_group.admin_lambda
  ]

  environment {
    variables = {
      PORT        = "3001"
      NODE_ENV    = var.environment == "local" ? "development" : "production"
      APP_NAME    = "admin-trini-backend"
      APP_VERSION = "1.0.0"

      # Logging / observability
      LOG_LEVEL                   = var.log_level
      NEW_RELIC_APP_NAME          = "admin-trini-backend"
      NEW_RELIC_LICENSE_KEY       = var.new_relic_license_key
      OTEL_SERVICE_NAME           = "admin-trini-backend"
      OTEL_EXPORTER_OTLP_ENDPOINT = var.otel_exporter_otlp_endpoint

      # Application
      JWT_SECRET           = var.jwt_secret
      JWT_EXPIRES          = var.jwt_expires
      CORS_ALLOWED_ORIGINS = var.cors_allowed_origins
      REQUEST_TIMEOUT      = tostring(var.request_timeout_ms)

      # Observability flags
      ENABLE_METRICS = "true"
      ENABLE_TRACING = "true"
      ENABLE_LOGGING = "true"

      # Admin authentication
      ADMIN_AUTH_USERNAME = var.admin_auth_username
      ADMIN_AUTH_PASSWORD = var.admin_auth_password
      ADMIN_AUTH_TOKEN    = var.admin_auth_token
      PUBLIC_API_TOKEN    = var.public_api_token

      # Product image storage
      PRODUCT_IMAGE_STORAGE_ENABLED = tostring(var.product_image_storage_enabled)
      S3_BUCKET_NAME                = aws_s3_bucket.product_images.bucket
      S3_ENDPOINT                   = var.use_localstack ? var.localstack_endpoint : ""
      S3_FORCE_PATH_STYLE           = tostring(var.use_localstack)

      S3_BUCKET_PUBLIC_BASE_URL = var.use_localstack ? "${var.localstack_endpoint}/${aws_s3_bucket.product_images.bucket}" : "https://${aws_cloudfront_distribution.product_images[0].domain_name}"

      # Persistence
      PERSISTENCE_DRIVER            = "dynamodb"
      DYNAMODB_ENDPOINT             = var.use_localstack ? var.localstack_endpoint : ""
      DYNAMODB_TABLE_PRODUCTS       = aws_dynamodb_table.products.name
      DYNAMODB_TABLE_CATEGORIES     = aws_dynamodb_table.categories.name
      DYNAMODB_TABLE_STORES         = aws_dynamodb_table.stores.name
      DYNAMODB_TABLE_INTERNAL_USERS = aws_dynamodb_table.internal_users.name
    }
  }
}