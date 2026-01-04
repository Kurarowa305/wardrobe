locals {
  tags = merge({
    Project   = "wardrobe"
    Env       = var.env
    ManagedBy = "terraform"
  }, var.tags)

  web_bucket_name    = "${var.name_prefix}web"
  images_bucket_name = "${var.name_prefix}images-${data.aws_caller_identity.current.account_id}"
  table_name         = "${var.name_prefix}WardrobeTable"
  api_name           = "${var.name_prefix}http-api"
  lambda_name        = "${var.name_prefix}api"
}
