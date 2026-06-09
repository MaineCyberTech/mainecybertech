# Maine CyberTech Final Deployment Operations Handbook

## Purpose

This handbook consolidates the final operating model for:

- **Terraform infrastructure** rooted at `infra/terraform`
- **GitHub Actions workflows** for validation, testing/dev deployment, and production deployment
- **Cloudflare DNS** for production and testing domains
- **Vercel** for web deployments
- **AWS ECS / ALB** for API and worker runtime deployment
- **Supabase** project provisioning and migration workflow awareness

This document is intended to be the operator-facing manual for day-to-day deployment, environment management, promotion, validation, and rollback.

---

## Final Environment Model

### Production
- Web app hostname: `app.mainecybertech.com`
- API hostname: `api.mainecybertech.com`
- DNS provider: Cloudflare
- Web hosting: Vercel production deployment
- API runtime: AWS ECS + ALB
- Terraform working directory: `infra/terraform`
- Terraform backend: `env/backend.prod.hcl`
- Terraform variable file: `env/prod.tfvars`
- Expected deployment branch: `main`

### Development / Testing
- Web app hostname: `app.mainecybertech.us`
- API hostname: `api.mainecybertech.us`
- DNS provider: Cloudflare
- Web hosting: Vercel preview/non-production deployment flow
- API runtime: AWS ECS + ALB using testing/dev values
- Terraform working directory: `infra/terraform`
- Terraform backend: `env/backend.dev.hcl`
- Terraform variable file: `env/dev.tfvars`
- Expected deployment branch: `develop`

---

## Final Repository Structure

```text
.github/workflows/
├── lint.yml
├── test.yml
├── validate.yml
├── typecheck.yml
├── e2e.yml
├── web-preview.yml
├── supabase-migrations.yml
├── terraform-plan.dev.yml
├── terraform-apply.dev.yml
├── terraform-plan.prod.yml
├── terraform-apply.prod.yml
├── api-deploy-ecs.dev.yml
├── api-deploy-ecs.prod.yml
├── worker-deploy-ecs.dev.yml
├── worker-deploy-ecs.prod.yml
├── web-dev-vercel.yml
└── web-prod-vercel.yml

infra/terraform/
├── README.md
├── variables.tf
├── terraform.tfvars.example
├── providers.tf
├── backend.tf
├── supabase.tf
├── secrets.tf
├── vercel.tf
├── network.tf
├── compute.tf
├── runtime.tf
├── dns.cloudflare.tf
├── github-oidc.tf
├── outputs.tf
├── env/
│   ├── dev.tfvars
│   ├── dev.tfvars.example
│   ├── prod.tfvars
│   ├── prod.tfvars.example
│   ├── backend.dev.hcl
│   ├── backend.dev.hcl.example
│   ├── backend.prod.hcl
│   └── backend.prod.hcl.example
└── scripts/
    ├── quickstart_terraform_deploy.ps1
    └── quickstart_terraform_deploy.sh
```

---

## Terraform Root Responsibilities

### Core infrastructure files
- `variables.tf` defines the input surface for AWS, Vercel, Supabase, Cloudflare, ECS runtime, autoscaling, and GitHub OIDC.
- `providers.tf` configures AWS, Vercel, Supabase, and Cloudflare providers.
- `supabase.tf` creates the Supabase project.
- `network.tf` creates the VPC, subnets, NAT gateway, API task security group, and ECS execution role.
- `compute.tf` creates the SQS queue and ECR repositories.

### Runtime files
- `runtime.tf` creates the ECS cluster, public ALB, target group, HTTP→HTTPS redirect, HTTPS listener, CloudWatch log groups, hardened task definitions, ECS services, and autoscaling.

### DNS and CI/CD integration files
- `dns.cloudflare.tf` manages production and testing app/API hostnames through Cloudflare.
- `github-oidc.tf` creates the AWS GitHub OIDC provider and OIDC roles for GitHub Actions.
- `outputs.tf` provides operator-facing outputs such as ALB DNS name, ECS service names, log groups, role ARNs, and final hostnames.

---

## Required GitHub Environments

Create three GitHub Environments:
- `dev` — dev/develop deploys (no approval required)
- `prod` — prod Terraform and Supabase migrations
- `prod-approval` — prod deployment gate (requires 1+ reviewers)

Use environment-scoped secrets and environment-scoped variables so the workflow names can stay consistent while values differ safely between development/testing and production.

---

## Required GitHub Secrets

### Terraform workflows (`dev` and `prod`)
- `AWS_TERRAFORM_ROLE_ARN`
- `CLOUDFLARE_API_TOKEN`
- `TF_VAR_DB_PASSWORD`
- `VERCEL_API_TOKEN`
- `SUPABASE_ACCESS_TOKEN`

### Deployment workflows (`dev` and `prod`)
- `AWS_DEPLOY_ROLE_ARN`
- `VERCEL_TOKEN`

---

## Required GitHub Variables

### Shared variable names per environment
- `AWS_REGION`
- `ECS_CLUSTER_NAME`
- `API_ECS_SERVICE`
- `WORKER_ECS_SERVICE`
- `API_ECR_REPOSITORY`
- `WORKER_ECR_REPOSITORY`
- `TF_BACKEND_CONFIG`
- `TF_VAR_FILE`

### Recommended environment-specific values

#### `dev`
- `TF_BACKEND_CONFIG=env/backend.dev.hcl`
- `TF_VAR_FILE=env/dev.tfvars`
- `ECS_CLUSTER_NAME` should refer to the testing/dev cluster
- `API_ECS_SERVICE` should refer to the testing/dev API service
- `WORKER_ECS_SERVICE` should refer to the testing/dev worker service

#### `prod`
- `TF_BACKEND_CONFIG=env/backend.prod.hcl`
- `TF_VAR_FILE=env/prod.tfvars`
- `ECS_CLUSTER_NAME` should refer to the production cluster
- `API_ECS_SERVICE` should refer to the production API service
- `WORKER_ECS_SERVICE` should refer to the production worker service

---

## Development Workflow from Local to Production

### 1) Local development
Developers work locally, run the application locally, and validate changes before pushing.

Recommended local activities before PR:
- install dependencies
- run local build/lint/test
- validate local app behavior
- validate local Terraform changes with `terraform fmt` and `terraform validate` if infra changes were made

### 2) Branch and PR flow
- Developer creates a feature branch.
- Developer opens a PR into `develop` for testing/dev promotion or into `main` if using a direct production promotion model.

### 3) CI validation on PR
The workflow set validates:
- workspace build
- linting
- tests
- web preview build validation
- Terraform plan against the target environment branch when infra changes are included

This provides a gate before deployment.

---

## Testing / Dev Deployment Workflow

### Trigger path
Testing/dev deployment begins when code is merged into `develop`.

### What runs on `develop`
- `terraform-apply.dev.yml`
- `api-deploy-ecs.dev.yml`
- `worker-deploy-ecs.dev.yml`
- `web-dev-vercel.yml`
- `supabase-migrations.yml` when `supabase/**` changes

### Terraform dev provisioning
The dev Terraform workflow:
1. checks out the repo
2. configures AWS credentials using OIDC
3. initializes Terraform with `env/backend.dev.hcl`
4. validates Terraform
5. applies Terraform with `env/dev.tfvars`

### Web dev deployment
The dev web workflow:
1. installs dependencies
2. runs `vercel pull` using preview/non-production mode
3. builds Vercel artifacts
4. deploys a non-production Vercel build

### API dev deployment
The dev API workflow:
1. builds the API Docker image from `apps/api/Dockerfile`
2. tags and pushes the image to the configured ECR repository
3. forces a new ECS deployment for the testing/dev API service

### Worker dev deployment
The dev worker workflow:
1. builds the worker Docker image from `apps/worker/Dockerfile`
2. tags and pushes the image to the configured ECR repository
3. forces a new ECS deployment for the testing/dev worker service

### Testing/dev validation checklist
After a successful `develop` deployment:
- confirm `app.mainecybertech.us` resolves and loads correctly
- confirm `api.mainecybertech.us` resolves and is healthy
- confirm Cloudflare testing DNS points to the intended targets
- confirm ECS dev services stabilize
- confirm ALB health checks are passing
- confirm logs are flowing to CloudWatch

---

## Production Deployment Workflow

### Trigger path
Production deployment begins when code is merged into `main`.

### What runs on `main`
- `terraform-apply.prod.yml`
- `api-deploy-ecs.prod.yml`
- `worker-deploy-ecs.prod.yml`
- `web-prod-vercel.yml`
- `supabase-migrations.yml` when `supabase/**` changes

### Terraform production provisioning
The prod Terraform workflow:
1. checks out the repo
2. configures AWS credentials using OIDC
3. initializes Terraform with `env/backend.prod.hcl`
4. validates Terraform
5. applies Terraform with `env/prod.tfvars`

### Web production deployment
The prod web workflow:
1. installs dependencies
2. runs `vercel pull --project mainecybertech-portal-prod --environment=production`
3. deploys source to Vercel production via `vercel deploy --project mainecybertech-portal-prod --prod`
4. Vercel builds from `apps/web/` (project `rootDirectory` setting) using install command from `apps/web/vercel.json`

### API production deployment
The prod API workflow:
1. builds the API Docker image from `apps/api/Dockerfile`
2. pushes the image to the production ECR repository
3. forces a new ECS deployment for the production API service

### Worker production deployment
The prod worker workflow:
1. builds the worker Docker image from `apps/worker/Dockerfile`
2. pushes the image to the production ECR repository
3. forces a new ECS deployment for the production worker service

### Production validation checklist
After a successful `main` deployment:
- confirm `app.mainecybertech.com` resolves and loads correctly
- confirm `api.mainecybertech.com` resolves and is healthy
- confirm Cloudflare production DNS points to the intended targets
- confirm ECS production services stabilize
- confirm ALB HTTPS is healthy
- confirm logs are flowing to CloudWatch
- confirm critical user flows work in production

---

## Terraform Plan Workflows

### `terraform-plan.dev.yml`
Runs when a pull request targets `develop` and Terraform files changed. It formats and validates Terraform, initializes the **dev/testing state backend**, and runs a Terraform plan using `env/dev.tfvars`.

### `terraform-plan.prod.yml`
Runs when a pull request targets `main` and Terraform files changed. It formats and validates Terraform, initializes the **production state backend**, and runs a Terraform plan using `env/prod.tfvars`.

This gives you environment-specific Terraform previews before code lands on either branch.

---

## How Cloudflare, Vercel, and AWS fit together

### App domains
- `app.mainecybertech.com` should point to the exact Vercel target returned for the production app domain.
- `app.mainecybertech.us` should point to the exact Vercel target returned for the testing/dev app domain.

### API domains
- `api.mainecybertech.com` should point to the production ALB/public API target.
- `api.mainecybertech.us` should point to the testing/dev ALB/public API target.

### Cloudflare management
Cloudflare DNS is managed through Terraform, which makes record changes reviewable and repeatable.

### Vercel management
Vercel handles the web deployment lifecycle; the Actions workflows drive the deployment path.

### AWS management
AWS hosts the API and worker containers, load balancing, and runtime logging/scaling.

---

## Promotion Rules

1. **Feature branches** only validate.
2. **`develop`** deploys to testing/dev.
3. **`main`** deploys to production.
4. Only promote to `main` after testing/dev validation succeeds.

This keeps testing and production separated, gives you a real promotion checkpoint, and keeps Terraform state and DNS targets isolated by environment.

---

## Rollback Guidance

### Web rollback
- redeploy the previous known-good Vercel build if needed
- confirm the production or testing hostname still points to the intended Vercel domain target

### API rollback
- restore the previous known-good image tag if you keep prior tags available
- force a new ECS deployment to the prior image/task definition state
- validate ALB health and endpoint behavior

### Terraform rollback
- use Terraform state and version control carefully
- review the plan before applying rollback-related Terraform changes
- never assume backend state or environment var files are interchangeable between dev and prod

---

## Operator Checklist

### Before enabling the full workflow set
- create `dev`, `prod`, and `prod-approval` GitHub Environments
- populate all required secrets and variables in both environments
- verify the active Terraform root is finalized at `infra/terraform`
- create real `env/dev.tfvars` and `env/prod.tfvars`
- create real `env/backend.dev.hcl` and `env/backend.prod.hcl`
- confirm Cloudflare zone IDs and app/API targets are correct
- confirm Vercel domains are assigned
- confirm ECS cluster/service values are correct per environment

### Before the first production deployment
- validate the testing/dev environment end to end
- validate `terraform-plan.prod.yml` output on a PR into `main`
- confirm production DNS targets
- confirm production ACM and ALB health
