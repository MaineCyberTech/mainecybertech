# Terraform Backend Configuration - Production
# Stores state in DigitalOcean Spaces (S3-compatible)

bucket         = "portal-terraform-state"
key            = "digitalocean/prod/terraform.tfstate"
region         = "us-east-1"
skip_credentials_validation = true
skip_metadata_api_check     = true
skip_requesting_account_id  = true
encrypt                     = true