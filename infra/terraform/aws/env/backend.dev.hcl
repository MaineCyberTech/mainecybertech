# Dev / testing backend configuration
bucket         = "mainecybertech-terraform-state-dev"
key            = "mainecybertech/dev/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "terraform-state-lock-dev"
encrypt        = true
