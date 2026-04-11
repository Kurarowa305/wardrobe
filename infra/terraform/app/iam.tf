data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

locals {
  lambda_dynamodb_domains             = toset(["wardrobe", "clothing", "template", "history"])
  lambda_dynamodb_read_only_domains   = toset(["presign"])
  lambda_s3_domains                   = toset(["presign"])
}

resource "aws_iam_role" "lambda" {
  name               = "${local.lambda_name}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = local.tags
}

resource "aws_iam_role" "lambda_domain" {
  for_each = local.lambda_domains

  name               = "${local.lambda_domain_name_by_domain[each.key]}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = local.tags
}

data "aws_iam_policy_document" "lambda_policy" {
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = [
      "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.lambda_name}:*",
    ]
  }

  statement {
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
      "dynamodb:BatchGetItem",
      "dynamodb:ConditionCheckItem",
      "dynamodb:TransactWriteItems",
      "dynamodb:DescribeTable",
    ]

    resources = [
      aws_dynamodb_table.wardrobe.arn,
      "${aws_dynamodb_table.wardrobe.arn}/index/*",
    ]
  }

  statement {
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]

    resources = [
      "${aws_s3_bucket.images.arn}/*",
    ]
  }

  statement {
    actions = [
      "s3:ListBucket",
    ]

    resources = [
      aws_s3_bucket.images.arn,
    ]
  }
}

resource "aws_iam_role_policy" "lambda" {
  name   = "${local.lambda_name}-policy"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_policy.json
}

data "aws_iam_policy_document" "lambda_domain_policy" {
  for_each = local.lambda_domains

  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = [
      "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.lambda_domain_name_by_domain[each.key]}:*",
    ]
  }

  dynamic "statement" {
    for_each = contains(local.lambda_dynamodb_domains, each.key) ? [1] : []

    content {
      actions = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:BatchGetItem",
        "dynamodb:ConditionCheckItem",
        "dynamodb:TransactWriteItems",
        "dynamodb:DescribeTable",
      ]

      resources = [
        aws_dynamodb_table.wardrobe.arn,
        "${aws_dynamodb_table.wardrobe.arn}/index/*",
      ]
    }
  }

  dynamic "statement" {
    for_each = contains(local.lambda_dynamodb_read_only_domains, each.key) ? [1] : []

    content {
      actions = [
        "dynamodb:GetItem",
      ]

      resources = [
        aws_dynamodb_table.wardrobe.arn,
      ]
    }
  }

  dynamic "statement" {
    for_each = contains(local.lambda_s3_domains, each.key) ? [1] : []

    content {
      actions = [
        "s3:GetObject",
        "s3:PutObject",
      ]

      resources = [
        "${aws_s3_bucket.images.arn}/*",
      ]
    }
  }

  dynamic "statement" {
    for_each = contains(local.lambda_s3_domains, each.key) ? [1] : []

    content {
      actions = [
        "s3:ListBucket",
      ]

      resources = [
        aws_s3_bucket.images.arn,
      ]
    }
  }
}

resource "aws_iam_role_policy" "lambda_domain" {
  for_each = local.lambda_domains

  name   = "${local.lambda_domain_name_by_domain[each.key]}-policy"
  role   = aws_iam_role.lambda_domain[each.key].id
  policy = data.aws_iam_policy_document.lambda_domain_policy[each.key].json
}
