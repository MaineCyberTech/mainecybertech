# Final Operator Map

## Active Terraform root
- `infra/terraform/`

## Production hostnames
- `app.mainecybertech.com`
- `api.mainecybertech.com`

## Testing hostnames
- `app.mainecybertech.us`
- `api.mainecybertech.us`

## Core files to manage
- `variables.tf`
- `providers.tf`
- `supabase.tf`
- `network.tf`
- `compute.tf`
- `runtime.tf`
- `dns.cloudflare.tf`
- `github-oidc.tf`
- `secrets.tf`
- `vercel.tf`
- `outputs.tf`

## Environment files
- `env/dev.tfvars.example`
- `env/prod.tfvars.example`
- `env/backend.dev.hcl.example`
- `env/backend.prod.hcl.example`

## Scripts
- `scripts/quickstart_terraform_deploy.ps1`
- `scripts/quickstart_terraform_deploy.sh`

## Recommended operating commands

### Dev/testing
```bash
terraform init -backend-config=env/backend.dev.hcl
terraform plan -var-file=env/dev.tfvars
terraform apply -var-file=env/dev.tfvars
```

### Production
```bash
terraform init -backend-config=env/backend.prod.hcl
terraform plan -var-file=env/prod.tfvars
terraform apply -var-file=env/prod.tfvars
```
