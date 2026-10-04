# Terraform Infrastructure

This directory contains Terraform configurations for the MCT portal infrastructure.

- `digitalocean/` - DigitalOcean infrastructure (active; the AWS root this
  directory once described was removed after the migration to DigitalOcean)

## Required variables

`admin_ip_ranges` (SSH allowlist) has **no default** — SSH is fail-closed. Every
plan/apply must supply it via a tfvars file (e.g. `["203.0.113.0/24"]`). The
`terraform-do` workflow reads it from the `ADMIN_IP_RANGES` GitHub secret and
aborts if it is unset or still contains `0.0.0.0/0` / `::/0`.

State locking uses the S3 backend's native `use_lockfile`, which requires
Terraform >= 1.10; the workflows and `scripts/install-terraform.ps1` pin 1.15.9
and `required_version` is `>= 1.15`.
