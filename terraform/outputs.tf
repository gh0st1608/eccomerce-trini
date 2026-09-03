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

output "dynamodb_table_stores" {
  value = aws_dynamodb_table.stores.name
}

output "dynamodb_table_internal_users" {
  value = aws_dynamodb_table.internal_users.name
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
