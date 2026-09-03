# Product images uploaded from the admin panel (S3ProductImageStorageClient.js).
# Private by default: in real AWS it is served through the CloudFront distribution
# in cdn.tf (Origin Access Control). Locally, the app talks to it directly via the
# LocalStack endpoint (S3_ENDPOINT / S3_FORCE_PATH_STYLE=true), same as docker-compose.
resource "aws_s3_bucket" "product_images" {
  bucket = local.product_images_bucket_name
}

resource "aws_s3_bucket_public_access_block" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_cors_configuration" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  cors_rule {
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = split(",", var.cors_allowed_origins)
    allowed_headers = ["*"]
    max_age_seconds = 3000
  }
}

# Static build output of frontend-ecommerce (Vite `npm run build`).
# Private by default; served through CloudFront in cdn.tf for real deployments.
resource "aws_s3_bucket" "frontend" {
  bucket = local.frontend_bucket_name
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  # Useful when validating the bucket locally against LocalStack, where CloudFront
  # (cdn.tf) is not created because it requires LocalStack Pro.
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}
