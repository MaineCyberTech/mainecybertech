# Terraform Backend Configuration - Dev
# Stores state in AWS S3 (or compatible) for team collaboration

bucket         = "mainecybertech-terraform-state"
key            = "digitalocean/dev/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "terraform-locks"
encrypt        = true