locals {
  lambda_domains = toset(["wardrobe", "clothing", "template", "history", "presign"])

  lambda_domain_handlers = {
    wardrobe = "entry/lambda/wardrobe_server.handler"
    clothing = "entry/lambda/clothing_server.handler"
    template = "entry/lambda/template_server.handler"
    history  = "entry/lambda/history_server.handler"
    presign  = "entry/lambda/presign_server.handler"
  }

  lambda_domain_name_by_domain = {
    for domain in local.lambda_domains :
    domain => "${var.lambda_app_name}-${var.env}-${domain}_server"
  }
}

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
      TABLE_NAME        = aws_dynamodb_table.wardrobe.name
      IMAGES_BUCKET     = aws_s3_bucket.images.bucket
      IMAGES_CDN_DOMAIN = aws_cloudfront_distribution.images.domain_name
      WEB_CDN_DOMAIN    = aws_cloudfront_distribution.web.domain_name
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda]

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "lambda_domain" {
  for_each = local.lambda_domains

  name              = "/aws/lambda/${local.lambda_domain_name_by_domain[each.key]}"
  retention_in_days = 14

  tags = local.tags
}

resource "aws_lambda_function" "domain" {
  for_each = local.lambda_domains

  function_name = local.lambda_domain_name_by_domain[each.key]
  role          = aws_iam_role.lambda.arn
  handler       = local.lambda_domain_handlers[each.key]
  runtime       = var.lambda_runtime

  memory_size = var.lambda_memory_size
  timeout     = var.lambda_timeout

  filename = var.lambda_package_path

  environment {
    variables = {
      TABLE_NAME        = aws_dynamodb_table.wardrobe.name
      IMAGES_BUCKET     = aws_s3_bucket.images.bucket
      IMAGES_CDN_DOMAIN = aws_cloudfront_distribution.images.domain_name
      WEB_CDN_DOMAIN    = aws_cloudfront_distribution.web.domain_name
      LAMBDA_DOMAIN     = each.key
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda_domain]

  tags = local.tags
}
