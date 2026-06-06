# Maine CyberTech Final Active Terraform Root

This bundle is a **single ready-to-run `infra/terraform/` directory** that integrates:

- the original core infrastructure files you created for AWS, Supabase, and Vercel
- the active ECS runtime layer
- production hardening
- Cloudflare DNS management
- GitHub OIDC for CI/CD
- dev/testing and production environment starter files

## What to copy over vs what to add

### Copy over existing files if they already exist in your repo
These files are included here as the **final integrated versions** and should replace earlier versions with the same names inside `infra/terraform/`:

- `variables.tf`
- `providers.tf`
- `supabase.tf`
- `network.tf`
- `compute.tf`
- `runtime.tf`
- `dns.cloudflare.tf`
- `github-oidc.tf`
- `outputs.tf`

### Add these if they do not already exist
- `terraform.tfvars.example`
- `env/dev.tfvars.example`
- `env/prod.tfvars.example`
- `env/backend.dev.hcl.example`
- `env/backend.prod.hcl.example`
- `scripts/quickstart_terraform_deploy.ps1`
- `scripts/quickstart_terraform_deploy.sh`

### Keep these files outside this bundle if they already exist in your repo
This bundle does **not** recreate your GitHub Actions workflow files. Keep or merge those separately in:
- `.github/workflows/`

---

## Directory layout

```text
infra/terraform/
├── README.md
├── variables.tf
├── terraform.tfvars.example
├── providers.tf
├── supabase.tf
├── network.tf
├── compute.tf
├── runtime.tf
├── dns.cloudflare.tf
├── github-oidc.tf
├── outputs.tf
├── env/
│   ├── dev.tfvars.example
│   ├── prod.tfvars.example
│   ├── backend.dev.hcl.example
│   └── backend.prod.hcl.example
└── scripts/
    ├── quickstart_terraform_deploy.ps1
    └── quickstart_terraform_deploy.sh
```

---

## What this final root contains

### Core platform layer
- AWS VPC and subnet topology
- NAT gateway
- ECS execution role
- ECR repositories
- SQS queue
- Supabase project
- Vercel project

### Runtime layer
- ECS cluster
- API ECS service
- Worker ECS service
- ALB
- target group
- HTTPS listener
- HTTP redirect listener
- API and worker CloudWatch log groups
- hardened task definitions
- autoscaling targets and policies

### Domain / CI-CD layer
- Cloudflare provider
- Cloudflare DNS records for production and testing app/API hostnames
- GitHub OIDC provider and IAM roles for GitHub Actions

---

## Ready-to-run operator flow

### Dev / testing
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

---

## Important assumptions

This final root assumes:
- the Terraform working directory is `infra/terraform`
- the app domains are:
  - `app.mainecybertech.com`
  - `app.mainecybertech.us`
- the API domains are:
  - `api.mainecybertech.com`
  - `api.mainecybertech.us`
- Cloudflare manages the DNS zones
- Vercel hosts the app custom domains
- AWS ECS + ALB hosts the API runtime

---

## Notes on Vercel DNS targets

For the app hostnames, use the **exact** target returned by the Vercel domain inspection flow for:
- `app.mainecybertech.com`
- `app.mainecybertech.us`

Do not hardcode a guessed Vercel target if the project reports a different target.

---

## Notes on environment separation

Use separate:
- backend state for dev/testing vs prod
- Cloudflare targets for dev/testing vs prod
- ALB targets for dev/testing vs prod
- tfvars files for dev/testing vs prod

This is the safest pattern for day-to-day operations.
