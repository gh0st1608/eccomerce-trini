resource "aws_acm_certificate" "frontend" {
  domain_name = "mayocollections.com"

  subject_alternative_names = [
    "*.mayocollections.com"
  ]

  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}