variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_account_id" {
  type = string
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "originals_bucket_name" {
  type = string
}

variable "processed_bucket_name" {
  type = string
}

variable "api_url" {
  type = string
}

variable "service_secret" {
  type      = string
  sensitive = true
}
