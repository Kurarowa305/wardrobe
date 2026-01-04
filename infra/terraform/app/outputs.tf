output "web_bucket_name" {
  value = aws_s3_bucket.web.bucket
}

output "images_bucket_name" {
  value = aws_s3_bucket.images.bucket
}

output "web_cdn_domain" {
  value = aws_cloudfront_distribution.web.domain_name
}

output "web_cdn_distribution_id" {
  value = aws_cloudfront_distribution.web.id
}

output "images_cdn_domain" {
  value = aws_cloudfront_distribution.images.domain_name
}

output "images_cdn_distribution_id" {
  value = aws_cloudfront_distribution.images.id
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.http_api.api_endpoint
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.wardrobe.name
}

output "lambda_function_name" {
  value = aws_lambda_function.api.function_name
}
