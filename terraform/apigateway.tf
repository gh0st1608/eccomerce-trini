# ---------------------------------------------------------------------------
# API Gateway REST API (V1)
#
# Routing contract:
#
#   /api/v1/admin/{proxy+}    -> admin-api Lambda
#   /api/v1/checkout/{proxy+} -> ecommerce-api Lambda
#
# This uses API Gateway REST (V1), which is supported by the LocalStack
# Freemium environment used for local development.
# ---------------------------------------------------------------------------

resource "aws_api_gateway_rest_api" "this" {
  name = "${local.name_prefix}-api"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# ===========================================================================
# /api
# ===========================================================================

resource "aws_api_gateway_resource" "api" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "api"
}

# ===========================================================================
# /api/v1
# ===========================================================================

resource "aws_api_gateway_resource" "v1" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "v1"
}

# ===========================================================================
# /api/v1/checkout
# ===========================================================================

resource "aws_api_gateway_resource" "checkout" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.v1.id
  path_part   = "checkout"
}

# /api/v1/checkout/{proxy+}
resource "aws_api_gateway_resource" "checkout_proxy" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.checkout.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "checkout_proxy" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.checkout_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "checkout_proxy" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.checkout_proxy.id
  http_method = aws_api_gateway_method.checkout_proxy.http_method

  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.checkout_api.invoke_arn
}

resource "aws_lambda_permission" "checkout_api_gateway" {
  statement_id  = "AllowApiGatewayInvokeCheckout"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.checkout_api.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

# ===========================================================================
# /api/v1/admin
# ===========================================================================

resource "aws_api_gateway_resource" "admin" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.v1.id
  path_part   = "admin"
}

# /api/v1/admin/{proxy+}
resource "aws_api_gateway_resource" "admin_proxy" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "admin_proxy" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.admin_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "admin_proxy" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = aws_api_gateway_resource.admin_proxy.id
  http_method = aws_api_gateway_method.admin_proxy.http_method

  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.admin_api.invoke_arn
}

resource "aws_lambda_permission" "admin_api_gateway" {
  statement_id  = "AllowApiGatewayInvokeAdmin"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.admin_api.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

# ===========================================================================
# Deployment
# ===========================================================================

resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  depends_on = [
    aws_api_gateway_integration.checkout_proxy,
    aws_api_gateway_integration.admin_proxy,
  ]

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.api.id,
      aws_api_gateway_resource.v1.id,

      aws_api_gateway_resource.checkout.id,
      aws_api_gateway_resource.checkout_proxy.id,
      aws_api_gateway_method.checkout_proxy.id,
      aws_api_gateway_integration.checkout_proxy.id,

      aws_api_gateway_resource.admin.id,
      aws_api_gateway_resource.admin_proxy.id,
      aws_api_gateway_method.admin_proxy.id,
      aws_api_gateway_integration.admin_proxy.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "default" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  deployment_id = aws_api_gateway_deployment.this.id
  stage_name    = "default"
}