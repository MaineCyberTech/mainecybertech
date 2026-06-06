terraform {
  backend "s3" {
    bucket         = "mainecybertech-terraform-state"  # Change to your bucket name
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}