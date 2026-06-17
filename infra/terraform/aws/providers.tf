#############################################
# Provider configuration
#
# AWS, Vercel, and Supabase come from the original core stack.
# Cloudflare is added here for DNS management.
#############################################

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "vercel" {
  team = var.vercel_team_id
}

provider "supabase" {}

# Cloudflare authentication is expected from CLOUDFLARE_API_TOKEN.
provider "cloudflare" {}
