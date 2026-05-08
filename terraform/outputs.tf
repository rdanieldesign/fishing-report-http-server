output "ecr_repository_url" {
  description = "ECR repository URL for the process-image Lambda image"
  value       = aws_ecr_repository.process_image.repository_url
}

output "lambda_function_arn" {
  description = "ARN of the process-image Lambda function"
  value       = aws_lambda_function.process_image.arn
}

output "lambda_role_name" {
  description = "IAM role name for the process-image Lambda (useful for manual policy attachments)"
  value       = aws_iam_role.process_image.name
}

output "originals_bucket_name" {
  description = "S3 originals bucket name (set as AWS_ORIGINAL_BUCKET in app env)"
  value       = aws_s3_bucket.originals.bucket
}

output "processed_bucket_name" {
  description = "S3 processed images bucket name (set as AWS_BUCKET in app env)"
  value       = aws_s3_bucket.processed.bucket
}
