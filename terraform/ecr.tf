resource "aws_ecr_repository" "process_image" {
  name                 = "process-image-${var.environment}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}
