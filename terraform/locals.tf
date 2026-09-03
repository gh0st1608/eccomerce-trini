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
}
