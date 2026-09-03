variable "project_name" {
  description = "Short name used as a prefix for every resource (buckets, functions, API, tags)."
  type        = string
  default     = "trini"
}

variable "environment" {
  description = "Deployment environment name (local, dev, staging, prod)."
  type        = string
  default     = "local"
}

variable "aws_region" {
  description = "AWS region for every resource. LocalStack ignores the real region restrictions."
  type        = string
  default     = "us-east-1"
}

variable "use_localstack" {
  description = "When true, points the AWS provider at a LocalStack endpoint instead of real AWS."
  type        = bool
  default     = true
}

variable "localstack_endpoint" {
  description = "LocalStack edge endpoint (only used when use_localstack = true)."
  type        = string
  default     = "http://localhost:4566"
}

variable "aws_access_key_id" {
  description = "Real AWS access key id. Ignored when use_localstack = true."
  type        = string
  default     = ""
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "Real AWS secret access key. Ignored when use_localstack = true."
  type        = string
  default     = ""
  sensitive   = true
}

# ---------------------------------------------------------------------------
# Lambda build artifacts
# ---------------------------------------------------------------------------
# Both services build their own dist/lambda.zip via `npm run build`
# (see ecommerce/scripts/build-lambda.mjs and admin/scripts/build-lambda.mjs).
# Run terraform/scripts/build-lambdas.ps1 (or .sh) before `terraform apply` so
# these zips exist; Terraform references them directly instead of re-zipping,
# matching the existing "Build -> Package Lambda -> Deploy" CI/CD steps.
variable "checkout_source_dir" {
  description = "Path to the checkout backend source used to build the Lambda package."
  type        = string
  default     = "../checkout"
}

variable "admin_source_dir" {
  description = "Path to the admin backend source used to build the Lambda package."
  type        = string
  default     = "../admin"
}

variable "lambda_runtime" {
  description = "Node.js Lambda runtime version, matching the Dockerfiles (node:20-alpine)."
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_memory_size" {
  description = "Memory (MB) allocated to each backend Lambda function."
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Timeout (seconds) for each backend Lambda function."
  type        = number
  default     = 15
}

variable "log_retention_in_days" {
  description = "CloudWatch Logs retention for Lambda log groups."
  type        = number
  default     = 14
}

# ---------------------------------------------------------------------------
# Shared app configuration (mirrors ecommerce/.env and admin/.env)
# ---------------------------------------------------------------------------
variable "log_level" {
  type    = string
  default = "info"
}

variable "cors_allowed_origins" {
  description = "Comma-separated list, forwarded as CORS_ALLOWED_ORIGINS to both backends."
  type        = string
  default     = "http://localhost:5173,http://localhost:8080"
}

variable "request_timeout_ms" {
  type    = number
  default = 10000
}

variable "jwt_secret" {
  description = "Shared JWT signing secret for checkout share tokens and admin sessions."
  type        = string
  default     = "local-development-secret-change-me"
  sensitive   = true
}

variable "jwt_expires" {
  type    = string
  default = "1h"
}

variable "admin_auth_username" {
  type    = string
  default = "admin"
}

variable "admin_auth_password" {
  type      = string
  default   = "admin123"
  sensitive = true
}

variable "admin_auth_token" {
  description = "Bearer token accepted by admin's protected write endpoints."
  type        = string
  default     = "trini-admin-local-token"
  sensitive   = true
}

variable "public_api_token" {
  description = "Bearer token accepted by admin's public read-only endpoints and used by ecommerce to call admin."
  type        = string
  default     = "trini-public-readonly-token"
  sensitive   = true
}

variable "admin_api_base_url" {
  description = "Base URL used by the checkout Lambda to call the admin API."
  type        = string
  default     = "http://localhost:3001/api/v1/admin"
}

variable "whatsapp_phone" {
  type    = string
  default = "51900000000"
}

variable "checkout_share_public_base_url" {
  description = "Public base URL used to build the /cart/shared checkout links (frontend origin)."
  type        = string
  default     = "http://localhost:8080"
}

variable "lnkua_bearer_token" {
  description = "LNK.ua bearer token used to shorten shared checkout URLs."
  type        = string
  default     = ""
  sensitive   = true
}

variable "new_relic_license_key" {
  type      = string
  default   = ""
  sensitive = true
}

variable "otel_exporter_otlp_endpoint" {
  type    = string
  default = "http://localhost:4318"
}

/* variable "admin_api_base_url" {
  description = "Base URL used by ecommerce-api to communicate with admin-api."
  type        = string
} */

# ---------------------------------------------------------------------------
# Product image storage (admin only)
# ---------------------------------------------------------------------------
variable "product_image_storage_enabled" {
  type    = bool
  default = true
}
