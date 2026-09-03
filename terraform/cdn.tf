
# =============================================================================
# CloudFront
# =============================================================================
#
# Production:
#
#   Internet
#      |
#      v
#   CloudFront
#      |
#      +---- /* -----------> S3 frontend
#      |
#      +---- /api/v1/* ----> API Gateway REST API
#                                  |
#                                  +--> admin Lambda
#                                  |
#                                  +--> ecommerce Lambda
#
# Local:
#
#   CloudFront is disabled because the local environment uses the Docker
#   gateway/nginx.conf directly.
#
#   Browser
#      |
#      v
#   localhost:8080
#      |
#      +---- frontend
#      |
#      +---- /api/v1/admin/* -------> admin-api:3001
#      |
#      +---- /api/v1/checkout/* ----> ecommerce-api:3000
#
# =============================================================================


locals {
  # CloudFront is created only for non-LocalStack environments.
  #
  # LocalStack is used to provision/test AWS services locally, while the
  # frontend traffic in the local Docker environment is handled by Nginx.
  create_cdn = var.use_localstack ? 0 : 1

  # API Gateway REST API origin.
  #
  # CloudFront's origin domain_name must contain only the hostname.
  # The API Gateway stage (/default) is configured separately through
  # origin_path below.
  api_origin_domain = "${aws_api_gateway_rest_api.this.id}.execute-api.${var.aws_region}.amazonaws.com"
}

# =============================================================================
# FRONTEND + API - CloudFront Distribution
# =============================================================================

resource "aws_cloudfront_origin_access_control" "frontend" {
  count = local.create_cdn

  name        = "${local.name_prefix}-frontend-oac"
  description = "OAC for ${local.name_prefix} frontend S3 bucket"

  origin_access_control_origin_type = "s3"

  signing_behavior = "always"
  signing_protocol = "sigv4"
}


resource "aws_cloudfront_distribution" "frontend" {
  count = local.create_cdn

  enabled             = true
  default_root_object = "index.html"

  comment = "${local.name_prefix} frontend + API gateway"

  aliases = [
    "mayocollections.com",
    "www.mayocollections.com"
  ]


  # ============================================================
  # FRONTEND S3
  # ============================================================

  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name

    origin_id = "frontend-s3"

    origin_access_control_id = aws_cloudfront_origin_access_control.frontend[0].id
  }


  # ============================================================
  # API GATEWAY
  # ============================================================

  origin {
    domain_name = local.api_origin_domain

    origin_id = "api-gateway"

    origin_path = "/default"

    custom_origin_config {
      http_port  = 80
      https_port = 443

      origin_protocol_policy = "https-only"

      origin_ssl_protocols = [
        "TLSv1.2"
      ]
    }
  }


  # ============================================================
  # SPA FALLBACK
  # ============================================================

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }


  # ============================================================
  # FRONTEND
  # ============================================================

  default_cache_behavior {
    target_origin_id = "frontend-s3"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = [
      "GET",
      "HEAD",
      "OPTIONS"
    ]

    cached_methods = [
      "GET",
      "HEAD"
    ]

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }


  # ============================================================
  # API
  # ============================================================

  ordered_cache_behavior {
    path_pattern = "/api/v1/*"

    target_origin_id = "api-gateway"

    viewer_protocol_policy = "https-only"

    allowed_methods = [
      "GET",
      "HEAD",
      "OPTIONS",
      "PUT",
      "POST",
      "PATCH",
      "DELETE"
    ]

    cached_methods = [
      "GET",
      "HEAD"
    ]

    forwarded_values {
      query_string = true

      headers = [
        "Authorization",
        "Content-Type",
        "Origin",
        "Access-Control-Request-Headers",
        "Access-Control-Request-Method"
      ]

      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }


  # ============================================================
  # RESTRICTIONS
  # ============================================================

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }


  # ============================================================
  # ACM CERTIFICATE
  # ============================================================

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.frontend.arn

    ssl_support_method = "sni-only"

    minimum_protocol_version = "TLSv1.2_2021"
  }
}


# =============================================================================
# FRONTEND S3 BUCKET POLICY
# =============================================================================
#
# Allows only the CloudFront distribution to read frontend objects.
#
# This resource is skipped entirely when using LocalStack.
#

data "aws_iam_policy_document" "frontend_bucket_policy" {
  count = local.create_cdn

  statement {
    sid = "AllowCloudFrontRead"

    actions = [
      "s3:GetObject"
    ]

    resources = [
      "${aws_s3_bucket.frontend.arn}/*"
    ]

    principals {
      type = "Service"

      identifiers = [
        "cloudfront.amazonaws.com"
      ]
    }

    condition {
      test = "StringEquals"

      variable = "AWS:SourceArn"

      values = [
        aws_cloudfront_distribution.frontend[0].arn
      ]
    }
  }
}


resource "aws_s3_bucket_policy" "frontend" {
  count = local.create_cdn

  bucket = aws_s3_bucket.frontend.id

  policy = data.aws_iam_policy_document.frontend_bucket_policy[0].json
}


# =============================================================================
# PRODUCT IMAGES - CloudFront Origin Access Control
# =============================================================================
#
# Product images have their own CloudFront distribution:
#
#   Browser
#      |
#      v
#   CloudFront
#      |
#      v
#   S3 product-images
#
# This distribution is disabled in LocalStack.
#

resource "aws_cloudfront_origin_access_control" "product_images" {
  count = local.create_cdn

  name = "${local.name_prefix}-product-images-oac"

  description = "OAC for ${local.name_prefix} product images S3 bucket"

  origin_access_control_origin_type = "s3"

  signing_behavior = "always"
  signing_protocol = "sigv4"
}


# =============================================================================
# PRODUCT IMAGES - CloudFront Distribution
# =============================================================================

resource "aws_cloudfront_distribution" "product_images" {
  count = local.create_cdn

  enabled = true

  comment = "${local.name_prefix} product images"


  # ---------------------------------------------------------------------------
  # S3 origin
  # ---------------------------------------------------------------------------

  origin {
    domain_name = aws_s3_bucket.product_images.bucket_regional_domain_name

    origin_id = "product-images-s3"

    origin_access_control_id = aws_cloudfront_origin_access_control.product_images[0].id
  }


  # ---------------------------------------------------------------------------
  # Cache behavior
  # ---------------------------------------------------------------------------

  default_cache_behavior {
    target_origin_id = "product-images-s3"

    viewer_protocol_policy = "redirect-to-https"

    allowed_methods = [
      "GET",
      "HEAD"
    ]

    cached_methods = [
      "GET",
      "HEAD"
    ]

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }
  }


  # ---------------------------------------------------------------------------
  # Restrictions
  # ---------------------------------------------------------------------------

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }


  # ---------------------------------------------------------------------------
  # Certificate
  # ---------------------------------------------------------------------------

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}


# =============================================================================
# PRODUCT IMAGES S3 BUCKET POLICY
# =============================================================================

data "aws_iam_policy_document" "product_images_bucket_policy" {
  count = local.create_cdn

  statement {
    sid = "AllowCloudFrontRead"

    actions = [
      "s3:GetObject"
    ]

    resources = [
      "${aws_s3_bucket.product_images.arn}/*"
    ]

    principals {
      type = "Service"

      identifiers = [
        "cloudfront.amazonaws.com"
      ]
    }

    condition {
      test = "StringEquals"

      variable = "AWS:SourceArn"

      values = [
        aws_cloudfront_distribution.product_images[0].arn
      ]
    }
  }
}


resource "aws_s3_bucket_policy" "product_images" {
  count = local.create_cdn

  bucket = aws_s3_bucket.product_images.id

  policy = data.aws_iam_policy_document.product_images_bucket_policy[0].json
}

