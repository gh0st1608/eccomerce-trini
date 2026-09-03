# When var.use_localstack = true, every AWS API call is redirected to the LocalStack
# edge port so the whole stack (S3, DynamoDB, IAM, Lambda, API Gateway, CloudWatch Logs)
# can be created and destroyed locally, without touching a real AWS account.
provider "aws" {
  region                      = var.aws_region
  access_key                  = var.use_localstack ? "test" : null
  secret_key                  = var.use_localstack ? "test" : null
  skip_credentials_validation = var.use_localstack
  skip_metadata_api_check     = var.use_localstack
  skip_requesting_account_id  = var.use_localstack
  # LocalStack doesn't resolve virtual-hosted-style S3 URLs (<bucket>.s3....); path-style
  # (s3.../<bucket>/...) is required or bucket operations fail client-side after the fact.
  s3_use_path_style = var.use_localstack

  dynamic "endpoints" {
    for_each = var.use_localstack ? [1] : []
    content {
      apigateway     = var.localstack_endpoint
      apigatewayv2   = var.localstack_endpoint
      cloudwatch     = var.localstack_endpoint
      cloudwatchlogs = var.localstack_endpoint
      dynamodb       = var.localstack_endpoint
      iam            = var.localstack_endpoint
      lambda         = var.localstack_endpoint
      s3             = var.localstack_endpoint
      sts            = var.localstack_endpoint
    }
  }

  default_tags {
    tags = local.common_tags
  }
}
