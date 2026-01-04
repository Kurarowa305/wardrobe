terraform {
  backend "s3" {
    bucket = "wardrobe-dev-tfstate"
    key    = "terraform/wardrobe/dev/terraform.tfstate"
    region = "ap-northeast-1"
  }
}
