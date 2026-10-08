
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


resource "aws_cloudfront_function" "spa_rewrite" {
  count = local.create_cdn

  name    = "${local.name_prefix}-spa-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrites SPA routes (no file extension) to /index.html"
  publish = true
  code    = file("${path.module}/functions/spa-rewrite.js")
}


# API caching is opt-in per response: the backend sends Cache-Control: no-store by default and
# `public, max-age=N` only for public catalog GETs (admin publicReadAuthMiddleware).
resource "aws_cloudfront_cache_policy" "api" {
  count = local.create_cdn

  name        = "${local.name_prefix}-api-cache"
  comment     = "Honors API Cache-Control; keyed by token, origin and query string"
  min_ttl     = 0
  default_ttl = 0
  max_ttl     = 300

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true

    # Authorization keeps public-token and admin-token responses in separate cache entries.
    # Origin keeps CORS response headers correct per requesting site.
    headers_config {
      header_behavior = "whitelist"
      headers {
        items = ["Authorization", "Origin"]
      }
    }

    query_strings_config {
      query_string_behavior = "all"
    }

    cookies_config {
      cookie_behavior = "none"
    }
  }
}

resource "aws_cloudfront_origin_request_policy" "api" {
  count = local.create_cdn

  name    = "${local.name_prefix}-api-origin-request"
  comment = "Forwards CORS and distributed-tracing headers without adding them to the cache key"

  headers_config {
    header_behavior = "whitelist"
    headers {
      items = [
        "Content-Type",
        "Access-Control-Request-Headers",
        "Access-Control-Request-Method",
        # Distributed tracing: without these, checkout -> admin (via this distribution)
        # and browser -> API traces break into disconnected pieces in New Relic.
        "traceparent",
        "tracestate",
        "newrelic",
      ]
    }
  }

  query_strings_config {
    query_string_behavior = "all"
  }

  cookies_config {
    cookie_behavior = "none"
  }
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
  # FRONTEND
  # ============================================================
  # SPA fallback lives in the spa_rewrite function below, scoped to this behavior.
  # Do not use distribution-wide custom_error_response here: it also rewrites
  # /api/v1/* 403/404 responses into a 200 HTML page.

  default_cache_behavior {
    target_origin_id = "frontend-s3"

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_rewrite[0].arn
    }

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

    # gzip/brotli at the edge: the main JS bundle goes from ~860 KB to ~250 KB.
    compress = true

    # TTLs come from the Cache-Control set on each S3 object at deploy time
    # (immutable for hashed /assets/*, short s-maxage for index.html).
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

    compress = true

    # Cache key (Authorization, Origin, query) is separate from what is merely forwarded
    # (tracing headers), so per-request traceparent values don't defeat the cache.
    cache_policy_id          = aws_cloudfront_cache_policy.api[0].id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.api[0].id
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

