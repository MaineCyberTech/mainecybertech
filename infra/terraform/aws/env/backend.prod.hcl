bucket         = "mainecybertech-terraform-state"
key            = "environments/prod/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "terraform-locks"
encrypt        = true
