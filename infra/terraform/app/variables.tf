variable "region" {
  type    = string
  default = "ap-northeast-1"
}

variable "env" {
  type    = string
  default = "dev"
}

variable "name_prefix" {
  type    = string
  default = "wardrobe-dev-"
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "lambda_handler" {
  type    = string
  default = "index.handler"
}

variable "lambda_runtime" {
  type    = string
  default = "nodejs20.x"
}

variable "lambda_memory_size" {
  type    = number
  default = 256
}

variable "lambda_timeout" {
  type    = number
  default = 10
}

variable "lambda_package_path" {
  type    = string
  default = "build/lambda.zip"
}
