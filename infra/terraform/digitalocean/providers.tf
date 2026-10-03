terraform {
  # use_lockfile (S3 native state locking) requires Terraform >= 1.10; the CI
  # workflows and scripts/install-terraform.ps1 pin 1.15.9, so require it here.
  required_version = ">= 1.15"

  backend "s3" {
    key    = "digitalocean/terraform.tfstate"
    region = "us-east-1"
    endpoints = {
      s3 = "https://nyc3.digitaloceanspaces.com"
    }
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_requesting_account_id  = true
    encrypt                     = true
    # Prevent concurrent applies from corrupting state (a manual dispatch on
    # another branch can run alongside the push-triggered workflow).
    use_lockfile = true
  }

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
