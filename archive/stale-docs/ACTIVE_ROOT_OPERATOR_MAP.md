# Final Operator Map for the Flattened Active Terraform Root

## Active Terraform root path
- `infra/terraform/`

## Files to keep in the active root
- `variables.tf` *(existing core stack)*
- `providers.tf` *(existing core stack)*
- `network.tf` *(existing core stack)*
- `compute.tf` *(existing core stack)*
- `supabase.tf` *(existing core stack)*
- `vercel.tf` *(existing core stack)*
- `active.variables.tf`
- `active.providers.tf`
- `active.runtime.networking.tf`
- `active.runtime.services.tf`
- `active.runtime.autoscaling.tf`
- `active.cicd.cloudflare-dns.tf`
- `active.cicd.github-oidc.tf`
- `active.outputs.tf`

## Environment files
- `env/dev.tfvars.example`
- `env/prod.tfvars.example`
- `env/backend.dev.hcl.example`
- `env/backend.prod.hcl.example`

## Scripts
- `scripts/quickstart_terraform_deploy.ps1`
- `scripts/quickstart_terraform_deploy.sh`

## Recommended command examples

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
