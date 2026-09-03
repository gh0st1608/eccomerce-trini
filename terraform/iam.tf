data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# --- checkout-api: only needs to write its own CloudWatch logs -------------
resource "aws_iam_role" "checkout_lambda" {
  name               = "${local.name_prefix}-checkout-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "checkout_lambda_logs" {
  role       = aws_iam_role.checkout_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- admin-api: logs + read/write access to the product images bucket ------
resource "aws_iam_role" "admin_lambda" {
  name               = "${local.name_prefix}-admin-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "admin_lambda_logs" {
  role       = aws_iam_role.admin_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "admin_lambda_s3" {
  statement {
    sid     = "ProductImagesReadWrite"
    actions = ["s3:PutObject", "s3:GetObject", "s3:ListBucket"]
    resources = [
      aws_s3_bucket.product_images.arn,
      "${aws_s3_bucket.product_images.arn}/*",
    ]
  }
}

resource "aws_iam_role_policy" "admin_lambda_s3" {
  name   = "${local.name_prefix}-admin-lambda-s3"
  role   = aws_iam_role.admin_lambda.id
  policy = data.aws_iam_policy_document.admin_lambda_s3.json
}

data "aws_iam_policy_document" "admin_lambda_dynamodb" {
  statement {
    sid = "CatalogAndOpsTablesReadWrite"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:BatchWriteItem",
      "dynamodb:BatchGetItem",
    ]
    resources = [
      aws_dynamodb_table.products.arn,
      aws_dynamodb_table.categories.arn,
      aws_dynamodb_table.stores.arn,
      aws_dynamodb_table.internal_users.arn,
    ]
  }
}

resource "aws_iam_role_policy" "admin_lambda_dynamodb" {
  name   = "${local.name_prefix}-admin-lambda-dynamodb"
  role   = aws_iam_role.admin_lambda.id
  policy = data.aws_iam_policy_document.admin_lambda_dynamodb.json
}
