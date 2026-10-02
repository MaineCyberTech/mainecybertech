# Final Operator Map

## Active Terraform root

- `infra/terraform/digitalocean/`

## Production hostnames

- `app.mainecybertech.com`
- `api.mainecybertech.com`

## Testing hostnames

- `app.mainecybertech.us`
- `api.mainecybertech.us`

## Core files

- `variables.tf` — 13 input variables (droplet size/region, SSH fingerprint, Cloudflare zone IDs, DB password, etc.)
- `providers.tf` — DigitalOcean + Cloudflare providers, backend config
- `droplet.tf` — droplet + cloud-init
- `firewall.tf` — inbound 22/80/443 only
- `dns.tf` — Cloudflare records (`prevent_destroy`)
- `outputs.tf` — droplet IP, etc.
- `cloud-init.yml` — first-boot provisioning

## Environment files (`infra/terraform/digitalocean/env/`)

- `backend.dev.hcl` / `backend.prod.hcl` — state backends
- `dev.tfvars` / `prod.tfvars` (+ `.example`)

## Operating commands

Terraform is **manual-dispatch only** (`.github/workflows/terraform-do.yml`); it no longer runs on push/PR, and `apply` requires the `apply` workflow input. From `infra/terraform/digitalocean/`:

```bash
terraform init -backend-config=env/backend.dev.hcl
terraform plan -var-file=env/dev.tfvars
terraform apply -var-file=env/dev.tfvars   # only with approval
```

Production uses `env/backend.prod.hcl` / `env/prod.tfvars`. The `prod-approval` environment currently has **no protection rules**, so add reviewers before relying on it as an approval gate. The DO API token must be valid (the current one returns 401, which blocks plan/apply).
