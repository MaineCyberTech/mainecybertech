# DR-P2-005: the Terraform state bucket must actually be versioned.
#
# docs/RTO_RPO.md has always claimed "DO Spaces (S3-compatible) with versioning
# enabled", but no resource backed that claim — the bucket was created by hand,
# so a corrupted or overwritten state object had no previous version to
# restore.
#
# The bucket already exists (it is this configuration's own S3 backend), so the
# import block imports it on the next plan/apply instead of trying to create it.
# DigitalOcean supports enabling versioning on an existing Spaces bucket via
# the S3 API, which is what the provider's `versioning` block issues.
#
# The S3 native lock file (`use_lockfile = true` in providers.tf) lives in this
# same bucket (`terraform.tfstate.tflock`), so bucket versioning also protects
# the lock object. This backend does not use DynamoDB locking, so there is no
# DynamoDB table / point-in-time-recovery setting to declare.

locals {
  # Must stay in sync with the `bucket` in env/backend.<environment>.hcl.
  terraform_state_bucket = var.environment == "prod" ? "portal-terraform-state-production" : "portal-terraform-state-development"
}

import {
  to = digitalocean_spaces_bucket.terraform_state
  id = "nyc3,${local.terraform_state_bucket}"
}

resource "digitalocean_spaces_bucket" "terraform_state" {
  name   = local.terraform_state_bucket
  region = "nyc3"

  versioning {
    enabled = true
  }

  lifecycle {
    # Losing the state bucket is losing the infrastructure; never let a plan
    # replace/destroy it (restores are done by copying a previous object
    # version — see docs/ROLLBACK_PROCEDURES.md §4).
    prevent_destroy = true
  }
}
