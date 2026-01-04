resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.lambda_name}"
  retention_in_days = 14

  tags = local.tags
}

resource "aws_lambda_function" "api" {
  function_name = local.lambda_name
  role          = aws_iam_role.lambda.arn
  handler       = var.lambda_handler
  runtime       = var.lambda_runtime

  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout

  filename = var.lambda_package_path

  environment {
    variables = {
      TABLE_NAME            = aws_dynamodb_table.wardrobe.name
      IMAGES_BUCKET         = aws_s3_bucket.images.bucket
      IMAGES_CDN_DOMAIN     = aws_cloudfront_distribution.images.domain_name
      WEB_CDN_DOMAIN        = aws_cloudfront_distribution.web.domain_name
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda]

  tags = local.tags
}
