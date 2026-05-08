resource "aws_s3_bucket" "originals" {
  bucket = var.originals_bucket_name
}

resource "aws_s3_bucket_cors_configuration" "originals" {
  bucket = aws_s3_bucket.originals.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT"]
    allowed_origins = [
      "https://fishing-report.site",
      "https://www.fishing-report.site",
    ]
    expose_headers = []
  }
}

# The processed images bucket already exists in prod (fishingreport).
# We import it rather than create it so Terraform can manage it going forward
# without destroying and recreating the bucket.
resource "aws_s3_bucket" "processed" {
  bucket = var.processed_bucket_name
}

resource "aws_s3_bucket_notification" "originals_trigger" {
  bucket = aws_s3_bucket.originals.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.process_image.arn
    events              = ["s3:ObjectCreated:Put"]
  }

  depends_on = [aws_lambda_permission.allow_s3]
}
