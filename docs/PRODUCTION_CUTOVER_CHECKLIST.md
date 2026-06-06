# Maine CyberTech Production Cutover Checklist

Use this as the **deployment-day one-page checklist** for promoting the production environment.

## Scope
- Production app hostname: `app.mainecybertech.com`
- Production API hostname: `api.mainecybertech.com`
- Terraform root: `infra/terraform`
- Production branch: `main`
- Production Terraform backend: `env/backend.prod.hcl`
- Production Terraform var file: `env/prod.tfvars`

---

## 1) Pre-cutover readiness
- [ ] Confirm all changes were validated in testing/dev first
- [ ] Confirm the production PR into `main` has been reviewed
- [ ] Confirm `terraform-plan.prod.yml` completed successfully for the production change set
- [ ] Confirm required GitHub Environment values exist in `prod`
- [ ] Confirm the production ACM certificate ARN is correct in production Terraform values
- [ ] Confirm the production Cloudflare zone ID and DNS targets are correct
- [ ] Confirm Vercel has the production app domain assigned for `app.mainecybertech.com`
- [ ] Confirm the production ALB/origin target used by `api.mainecybertech.com` is correct

---

## 2) GitHub production environment checks
### Required production secrets
- [ ] `AWS_TERRAFORM_ROLE_ARN`
- [ ] `AWS_DEPLOY_ROLE_ARN`
- [ ] `CLOUDFLARE_API_TOKEN`
- [ ] `TF_VAR_DB_PASSWORD`
- [ ] `VERCEL_API_TOKEN`
- [ ] `VERCEL_TOKEN`
- [ ] `SUPABASE_ACCESS_TOKEN`

### Required production variables
- [ ] `AWS_REGION`
- [ ] `ECS_CLUSTER_NAME`
- [ ] `API_ECS_SERVICE`
- [ ] `WORKER_ECS_SERVICE`
- [ ] `API_ECR_REPOSITORY`
- [ ] `WORKER_ECR_REPOSITORY`
- [ ] `TF_BACKEND_CONFIG=env/backend.prod.hcl`
- [ ] `TF_VAR_FILE=env/prod.tfvars`

---

## 3) Terraform production apply readiness
- [ ] Confirm `infra/terraform/env/prod.tfvars` exists with real production values
- [ ] Confirm `infra/terraform/env/backend.prod.hcl` exists with the real production backend configuration
- [ ] Confirm production Terraform state is isolated from testing/dev state
- [ ] Confirm planned DNS changes are understood before apply
- [ ] Confirm planned ECS/ALB changes are understood before apply

### Recommended operator commands
```bash
terraform init -backend-config=env/backend.prod.hcl
terraform plan -var-file=env/prod.tfvars
terraform apply -var-file=env/prod.tfvars
```

---

## 4) Web production cutover checks
- [ ] Confirm `app.mainecybertech.com` is assigned in Vercel
- [ ] Confirm the exact production Vercel DNS target was inspected and recorded
- [ ] Confirm the Cloudflare production app record points to the intended Vercel target
- [ ] Confirm the production Vercel deployment workflow completed successfully
- [ ] Confirm the app loads over HTTPS at `app.mainecybertech.com`
- [ ] Confirm login and at least one critical dashboard path works

---

## 5) API production cutover checks
- [ ] Confirm the production API image was built and pushed successfully
- [ ] Confirm the production ECS API service rolled successfully
- [ ] Confirm the production ECS worker service rolled successfully if worker changes were part of release
- [ ] Confirm the production ALB target group is healthy
- [ ] Confirm the Cloudflare production API record points to the intended production API target
- [ ] Confirm `api.mainecybertech.com` responds correctly over HTTPS
- [ ] Confirm at least one critical API endpoint or health route passes

---

## 6) DNS / domain checks
- [ ] Confirm Cloudflare production app/API records are correct after apply
- [ ] Confirm no accidental testing/dev domain values were promoted to production
- [ ] Confirm `app.mainecybertech.com` and `api.mainecybertech.com` resolve to the intended production targets

---

## 7) Post-cutover validation
- [ ] Confirm the web app is reachable and stable
- [ ] Confirm the API is reachable and stable
- [ ] Confirm ECS services remain steady after rollout
- [ ] Confirm ALB HTTPS remains healthy
- [ ] Confirm CloudWatch logs are flowing for API and worker
- [ ] Confirm no high-severity errors appear immediately after deployment

---

## 8) Rollback triggers
Rollback should be considered immediately if any of the following occur:
- [ ] Production app does not load correctly over HTTPS
- [ ] Production API health checks fail
- [ ] ECS service does not stabilize
- [ ] Cloudflare production DNS points to the wrong target
- [ ] Critical auth/user journeys fail

### Rollback actions
- [ ] Revert the production app deployment to the previous known-good Vercel build if needed
- [ ] Revert the production API/worker deployment to the previous known-good image/task definition state if needed
- [ ] Revert Cloudflare production DNS records if the wrong production target was applied
- [ ] Re-run validation after rollback
