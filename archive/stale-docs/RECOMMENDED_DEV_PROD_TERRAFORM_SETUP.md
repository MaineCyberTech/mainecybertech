# Recommended File Setup for Dev and Prod Terraform Testing

Below is the setup I would recommend for your repo, given the current pack structure and your goal of keeping production and testing/dev disciplined.

---

## 1. Recommended Folder Strategy

Use `infra/terraform` as the active Terraform root and keep formal environment files under `infra/terraform/env/`.

### Recommended structure
```text
infra/terraform/
├── env/
│   ├── dev.tfvars
│   ├── dev.tfvars.example
│   ├── prod.tfvars
│   ├── prod.tfvars.example
│   ├── backend.dev.hcl.example
│   └── backend.prod.hcl.example
├── base-runtime/
├── production-hardening/
├── cicd/
├── examples/
└── scripts/
```

### Why I recommend this
- keeps the environment values separate from the reusable Terraform source packs
- keeps dev/testing and production clearly separated
- supports different backends or state keys by environment
- reduces the chance of accidental production apply using testing values

---

## 2. Recommended Active Terraform Pattern

### Option A — best for maintainability
Keep the subfolders as reference/source packs, but create an **active root** in `infra/terraform/` by copying the final chosen `.tf` files into the root.

Example active root contents:
```text
infra/terraform/
├── variables.tf
├── providers.tf
├── network.tf
├── compute.tf
├── supabase.tf
├── vercel.tf
├── runtime_cluster.tf
├── runtime_security.tf
├── runtime_alb.tf
├── runtime_services.tf
├── runtime_logs.hardened.tf
├── runtime_taskdefs.hardened.tf
├── runtime_autoscaling.hardened.tf
├── cicd_cloudflare_provider.tf
├── cicd_cloudflare_dns.tf
├── cicd_github_oidc.tf
├── outputs.tf
└── env/
```

### Why this is my recommendation
Terraform works best when the active deployment root is straightforward. Keeping too many alternate files in the active root can become confusing unless you are disciplined about file naming and ownership.

---

## 3. Recommended Environment Files

### `env/dev.tfvars.example`
Should contain:
- testing Cloudflare zone ID (`mainecybertech.us`)
- testing app target
- testing API target
- lower desired task counts
- smaller autoscaling max values
- testing ACM/domain values if applicable

### `env/prod.tfvars.example`
Should contain:
- production Cloudflare zone ID (`mainecybertech.com`)
- production app target
- production API target
- production autoscaling settings
- production ACM/domain values

### `env/backend.dev.hcl.example`
Should define the dev/testing remote backend values.

### `env/backend.prod.hcl.example`
Should define the production remote backend values.

**Why separate backends matter:**
This prevents the most dangerous Terraform mistake in multi-environment setups: using the wrong state against the wrong infrastructure.

---

## 4. Recommended Dev vs Prod Policy

### Dev / testing
I recommend:
- separate Cloudflare zone: `mainecybertech.us`
- separate ALB/API origin target
- separate tfvars file
- separate backend/state key
- lower autoscaling ceilings
- easier debugging/proxy toggling for API if needed

### Production
I recommend:
- separate Cloudflare zone: `mainecybertech.com`
- separate backend/state key
- hardened HTTPS + logs + autoscaling enabled
- stricter change control around DNS and listener changes

---

## 5. Recommended Commenting Style in Terraform

For your repo, I would comment **why a block exists**, not every obvious line.

Good example:
```hcl
# Public ALB for the API. This remains internet-facing while the API tasks stay in private subnets.
resource "aws_lb" "api" {
  name               = var.alb_name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
}
```

Good example:
```hcl
# Cloudflare production app hostname. The target must match the exact CNAME value returned by Vercel
# for app.mainecybertech.com so DNS cutovers remain deterministic.
resource "cloudflare_dns_record" "prod_app" {
  zone_id = var.cloudflare_zone_id_prod
  name    = var.cloudflare_prod_app_name
  type    = "CNAME"
  content = var.cloudflare_prod_app_target
  ttl     = 1
  proxied = var.cloudflare_proxy_app_records
}
```

This style helps future operators understand intent quickly without making the files noisy.

---

## 6. My Recommended Minimum Environment File Set

If I were setting this repo up for you right now, I would create these next:

### Active Terraform environment files
- `infra/terraform/env/dev.tfvars.example`
- `infra/terraform/env/prod.tfvars.example`
- `infra/terraform/env/backend.dev.hcl.example`
- `infra/terraform/env/backend.prod.hcl.example`

### Optional but highly useful
- `infra/terraform/ACTIVE_ROOT_MERGE_MAP.md`
- `infra/terraform/COMMENTED_EXAMPLE_ACTIVE_ROOT.tf.md`
- `docs/domain-operations/CHANGE_PROMOTION_CHECKLIST.md`

---

## 7. Recommended Terraform Commands by Environment

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

This is the cleanest and safest operator pattern for your current layout.
