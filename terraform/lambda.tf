resource "aws_lambda_function" "process_image" {
  function_name = "processImage${title(var.environment)}"
  role          = aws_iam_role.process_image.arn
  package_type  = "Image"
  image_uri     = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/process-image-${var.environment}:latest"
  architectures = ["x86_64"]
  memory_size   = 512
  timeout       = 30

  environment {
    variables = {
      AWS_BUCKET     = var.processed_bucket_name
      API_URL        = var.api_url
      SERVICE_SECRET = var.service_secret
    }
  }

  depends_on = [aws_ecr_repository.process_image]
}

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.process_image.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.originals.arn
}
