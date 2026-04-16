locals {
  cors_allow_origins = [
    "https://${aws_cloudfront_distribution.web.domain_name}"
  ]

  apigw_domain_integrations = {
    wardrobe = aws_lambda_function.domain["wardrobe"].invoke_arn
    clothing = aws_lambda_function.domain["clothing"].invoke_arn
    template = aws_lambda_function.domain["template"].invoke_arn
    history  = aws_lambda_function.domain["history"].invoke_arn
    presign  = aws_lambda_function.domain["presign"].invoke_arn
  }

  apigw_domain_route_keys = {
    wardrobe = [
      "ANY /wardrobes",
      "ANY /wardrobes/{wardrobeId}"
    ]
    clothing = [
      "ANY /wardrobes/{wardrobeId}/clothing",
      "ANY /wardrobes/{wardrobeId}/clothing/{clothingId}"
    ]
    template = [
      "ANY /wardrobes/{wardrobeId}/templates",
      "ANY /wardrobes/{wardrobeId}/templates/{templateId}"
    ]
    history = [
      "ANY /wardrobes/{wardrobeId}/histories",
      "ANY /wardrobes/{wardrobeId}/histories/{historyId}"
    ]
    presign = [
      "ANY /wardrobes/{wardrobeId}/images/presign",
      "ANY /wardrobes/{wardrobeId}/images/presign/{proxy+}"
    ]
  }

  apigw_route_integrations = merge([
    for domain, route_keys in local.apigw_domain_route_keys : {
      for route_key in route_keys :
      route_key => domain
    }
  ]...)
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = local.api_name
  protocol_type = "HTTP"

  cors_configuration {
    allow_headers = ["*"]
    allow_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    allow_origins = local.cors_allow_origins
  }

  tags = local.tags
}

resource "aws_cloudwatch_log_group" "api_gw" {
  name              = "/aws/apigateway/${local.api_name}"
  retention_in_days = 14

  tags = local.tags
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn
    format = jsonencode({
      requestId               = "$context.requestId"
      httpMethod              = "$context.httpMethod"
      path                    = "$context.path"
      protocol                = "$context.protocol"
      status                  = "$context.status"
      responseLength          = "$context.responseLength"
      integrationErrorMessage = "$context.integrationErrorMessage"
      requestTime             = "$context.requestTime"
      sourceIp                = "$context.identity.sourceIp"
      userAgent               = "$context.identity.userAgent"
    })
  }

  tags = local.tags
}

resource "aws_apigatewayv2_integration" "domain" {
  for_each = local.apigw_domain_integrations

  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = each.value
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "domain" {
  for_each = local.apigw_route_integrations

  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = each.key
  target    = "integrations/${aws_apigatewayv2_integration.domain[each.value].id}"
}

resource "aws_lambda_permission" "apigw_domain" {
  for_each = local.lambda_domains

  statement_id  = "AllowExecutionFromApiGateway${title(each.key)}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.domain[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}
