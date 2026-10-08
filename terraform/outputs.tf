output "api_gateway_invoke_url" {
  description = "API Gateway REST API invoke URL."
  value       = aws_api_gateway_stage.default.invoke_url
}

output "checkout_lambda_function_name" {
  value = aws_lambda_function.checkout_api.function_name
}

output "admin_lambda_function_name" {
  value = aws_lambda_function.admin_api.function_name
}

output "product_images_bucket_name" {
  value = aws_s3_bucket.product_images.bucket
}

output "dynamodb_table_products" {
  value = aws_dynamodb_table.products.name
}

output "dynamodb_table_categories" {
  value = aws_dynamodb_table.categories.name
}

output "dynamodb_table_storefront_settings" {
  description = "DynamoDB table used for storefront settings"
  value       = aws_dynamodb_table.storefront_settings.name
}

output "dynamodb_table_stores" {
  value = aws_dynamodb_table.stores.name
}

output "dynamodb_table_internal_users" {
  value = aws_dynamodb_table.internal_users.name
}

output "dynamodb_table_orders" {
  value = aws_dynamodb_table.orders.name
}

output "frontend_bucket_name" {
  value = aws_s3_bucket.frontend.bucket
}

output "frontend_website_endpoint" {
  description = "S3 static website endpoint, useful when use_localstack = true (no CloudFront)."
  value       = aws_s3_bucket_website_configuration.frontend.website_endpoint
}

output "frontend_cloudfront_domain_name" {
  description = "Only set when use_localstack = false."
  value       = try(aws_cloudfront_distribution.frontend[0].domain_name, null)
}

output "product_images_cloudfront_domain_name" {
  description = "Only set when use_localstack = false."
  value       = try(aws_cloudfront_distribution.product_images[0].domain_name, null)
}

# Public Browser agent settings, injected as VITE_NEW_RELIC_BROWSER_* at frontend build time
# (terraform/scripts/build-frontend.ps1). Safe to expose: they ship inside the JS bundle.
output "new_relic_browser_config" {
  value = local.browser_loader_config == null ? null : {
    account_id  = tostring(local.browser_loader_config.accountID)
    trust_key   = tostring(local.browser_loader_config.trustKey)
    agent_id    = tostring(local.browser_loader_config.agentID)
    license_key = local.browser_loader_config.licenseKey
  }
}
