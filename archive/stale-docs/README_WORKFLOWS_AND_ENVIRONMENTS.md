> **⚠️ Historical document.** References workflow names that have since been renamed or removed. Current workflows are listed in `AGENTS.md` under "CI/CD" and in `.github/workflows/` (17 .yml files).

This bundle provides a **complete GitHub Actions workflow set** and a **documented promotion path** from local development to testing/dev and then to production.

## What your current uploaded workflows show

Your current workflow files already establish several patterns:

- `build.yml`, `lint.yml`, and `test.yml` are currently triggered on `push` and `pull_request` for `main` and `develop`, with a Node version matrix on `18.x` and `20.x`, but the uploaded snippets only show the first checkout step rather than full job bodies. citeturn13search47turn13search49turn13search48
- `web-preview.yml` is currently a pull-request scoped validation workflow for `apps/web/**` and `packages/**`, again with only the initial checkout shown in the uploaded file. citeturn13search53
- `terraform-plan.yml` and `terraform-apply.yml` already target `infra/terraform/**` and use `working-directory: infra/terraform`, which aligns with your final Terraform root choice. citeturn13search46turn13search45
- `api-deploy-ecs.yml` and `worker-deploy-ecs.yml` already use AWS OIDC, ECR login, Docker builds, and ECS force-new-deployment against `main`. citeturn13search54turn13search50
- `web-prod-vercel.yml` already uses `vercel pull`, `vercel build`, and `vercel deploy --prebuilt --prod` for main-branch production deployment. citeturn13search51
- `supabase-migrations.yml` currently triggers on pushes to `develop` and `main` when `supabase/**` changes. citeturn6search6

This bundle turns those patterns into a **cohesive dev/prod deployment model**.

## Target environment model used in this bundle

### Development / testing
- Branch: `develop`
- Terraform root: `infra/terraform`
- Terraform backend: `env/backend.dev.hcl`
- Terraform variables: `env/dev.tfvars`
- Web hostname: `app.mainecybertech.us`
- API hostname: `api.mainecybertech.us`
- Web deployment target: Vercel preview/non-production deployment flow
- API/worker deployment target: ECS services and origins assigned to the testing environment

### Production
- Branch: `main`
- Terraform root: `infra/terraform`
- Terraform backend: `env/backend.prod.hcl`
- Terraform variables: `env/prod.tfvars`
- Web hostname: `app.mainecybertech.com`
- API hostname: `api.mainecybertech.com`
- Web deployment target: Vercel production deployment
- API/worker deployment target: ECS services and origins assigned to production

---

## Development workflow from local machine to production

### 1) Local development
Developers make changes locally, run the application locally, and validate the application before pushing. In your repo pattern, this is where local environment management, Supabase local/dev work, and app testing happen before code leaves the machine. This part is a team process choice rather than something explicitly defined by the uploaded workflow files. The uploaded workflows only begin once code is pushed to GitHub. citeturn13search47turn13search49turn13search48

### 2) Pull request validation
When a feature branch opens a PR:
- `build.yml` validates the workspace build
- `lint.yml` validates linting
- `test.yml` runs tests
- `web-preview.yml` validates the web app build when web-related files change
- `terraform-plan.dev.yml` or `terraform-plan.prod.yml` can show Terraform changes depending on the target branch

This creates an early feedback layer before deployment.

### 3) Merge to `develop` → testing/dev deployment
When code lands on `develop`:
- testing Terraform can be applied using `terraform-apply.dev.yml`
- testing web deploy can publish a non-production Vercel deployment using `web-dev-vercel.yml`
- testing API/worker deploy workflows push images and roll the testing ECS services
- Supabase migrations can still run on `develop` when `supabase/**` changes, consistent with your current migration workflow trigger. citeturn6search6

### 4) Validation in testing/dev
After `develop` deploys:
- validate the testing web app at `app.mainecybertech.us`
- validate the testing API at `api.mainecybertech.us`
- confirm Cloudflare testing records point to the intended targets
- confirm the testing ECS services stabilize and health checks pass

### 5) Promote to `main` → production deployment
When tested changes are merged to `main`:
- production Terraform apply can run
- production web deploy can publish via Vercel production
- production API/worker images deploy to the production ECS services
- production DNS remains on `mainecybertech.com`

### 6) Post-production validation
After `main` deploys:
- validate the production app at `app.mainecybertech.com`
- validate the production API at `api.mainecybertech.com`
- confirm ALB and ECS service health
- confirm Cloudflare production records point to the intended production targets

---

## How each environment is provisioned in this model

### Terraform provisioning
This bundle assumes environment provisioning comes from the final active Terraform root at `infra/terraform` and is separated by backend + tfvars file.

**Testing/dev** is provisioned with:
```bash
terraform init -backend-config=env/backend.dev.hcl
terraform plan -var-file=env/dev.tfvars
terraform apply -var-file=env/dev.tfvars
```

**Production** is provisioned with:
```bash
terraform init -backend-config=env/backend.prod.hcl
terraform plan -var-file=env/prod.tfvars
terraform apply -var-file=env/prod.tfvars
```

### Web environment provisioning
- Testing/dev uses the Vercel non-production workflow and the testing custom domain `app.mainecybertech.us`
- Production uses the Vercel production workflow and `app.mainecybertech.com`

### API/worker environment provisioning
- Testing/dev uses separate ECS service variables and repo/environment variables mapped to the testing services
- Production uses the production ECS service variables and repo/environment variables mapped to production

### DNS provisioning
Cloudflare records are managed by Terraform in the final root, with testing values in `dev.tfvars` and production values in `prod.tfvars`.

---

## Recommendation: use GitHub Environments

To keep the same workflow file names but still separate dev and prod safely, I strongly recommend using **GitHub Environments**:

- Environment: `dev`
- Environment: `prod`

Then define **environment-scoped secrets and variables** with the same names per environment. This avoids duplicating secret names while keeping values separate.

For example:
- `AWS_DEPLOY_ROLE_ARN` in `dev` points to the testing deployment role
- `AWS_DEPLOY_ROLE_ARN` in `prod` points to the production deployment role

The workflow files in this bundle already use the same secret/variable names so you can apply that pattern cleanly.
