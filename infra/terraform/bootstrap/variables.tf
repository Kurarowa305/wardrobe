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
