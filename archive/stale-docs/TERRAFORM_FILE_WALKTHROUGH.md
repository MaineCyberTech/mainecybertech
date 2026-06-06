# Detailed Walkthrough of the Terraform Files

This walkthrough explains what each `.tf` file in the merged domain operations pack is doing, why it exists, and when you would keep, replace, or promote it into the active Terraform root.

---

## A. Base Runtime Layer (`infra/terraform/base-runtime/`)

### `runtime_variables.tf`
**What it does:**
Defines the core runtime variables used by the base ECS + ALB layer.

**Why it is needed:**
This file keeps the runtime configurable instead of hardcoding values such as cluster name, service names, desired counts, ALB name, target group name, and container port.

**Key values:**
- ECS cluster name
- API and worker service names
- desired task counts
- API container port
- health check path
- ALB and target group names
- allowed CIDRs for the public ALB listener

**When to change it:**
Change this when you want different service names, scaling defaults, ALB naming, or a different API port.

### `runtime_cluster.tf`
**What it does:**
Creates the ECS cluster resource.

**Why it is needed:**
The ECS services need a cluster to run inside. This is the runtime control plane that groups the API and worker services.

### `runtime_security.tf`
**What it does:**
Creates:
- the ALB security group
- the worker task security group
- the ingress rule that allows the ALB to reach the API task security group

**Why it is needed:**
Without this file, the load balancer cannot reach the API task port, and the worker service would not have a formally declared security group.

**Important design detail:**
The API ingress rule is intentionally SG-to-SG, which is cleaner than IP-based rules inside the VPC.

### `runtime_alb.tf`
**What it does:**
Creates:
- the public ALB
- the API target group
- the HTTP listener

**Why it is needed:**
This is what makes the API reachable through a public load balancer in the base runtime layer.

**Base-layer limitation:**
This file provides HTTP only. HTTPS is added in the production-hardening overlay.

### `runtime_services.tf`
**What it does:**
Creates:
- the ECS API service
- the ECS worker service

**Why it is needed:**
Task definitions describe containers, but services keep the desired number of tasks running and attached to networking/load balancing where needed.

**Important design detail:**
- the API service is attached to the target group
- the worker service is private and has no load balancer

### `runtime_outputs.tf`
**What it does:**
Exports useful runtime values such as:
- cluster name/ARN
- service names
- ALB DNS name

**Why it is needed:**
Outputs make follow-on automation and operator validation easier.

### `runtime.auto.tfvars.example`
**What it does:**
Provides example values for the base runtime variables.

**Why it is needed:**
This is the operator starting point for setting names, ports, and runtime defaults in a predictable way.

---

## B. Production Hardening Layer (`infra/terraform/production-hardening/`)

### `runtime_variables.hardened.tf`
**What it does:**
Declares the extra variables needed for a hardened production-style runtime.

**Why it is needed:**
The base runtime is intentionally simple. Production environments need HTTPS, logging, autoscaling, secret injection, and better service controls.

**What it adds conceptually:**
- HTTPS listener ports
- ACM certificate ARN
- Route53-related options (optional)
- task sizing for hardened task definitions
- ECS Exec toggle
- log retention controls
- extra environment variables
- secret injection lists
- autoscaling min/max and CPU targets

### `runtime_locals.hardened.tf`
**What it does:**
Builds the final environment variable arrays and aggregate secret ARN lists.

**Why it is needed:**
This avoids duplicating environment-building logic in the task definition resources. It also makes the secrets IAM policy generation possible.

### `runtime_security.hardened.tf`
**What it does:**
Expands the security model so the ALB can accept both HTTP and HTTPS while still allowing the ALB to reach the API task SG.

**Why it is needed:**
Once you add HTTPS, the ALB must accept port 443 in addition to port 80.

### `runtime_alb.hardened.tf`
**What it does:**
Builds the hardened ALB layer with:
- HTTP listener that redirects to HTTPS
- HTTPS listener using ACM
- target group still forwarding to the API

**Why it is needed:**
This is the transition from a basic test/minimal runtime to a production-ready public entry point.

### `runtime_logs.hardened.tf`
**What it does:**
Creates dedicated CloudWatch log groups for API and worker containers.

**Why it is needed:**
Without explicit log groups, observability is weaker and lifecycle/retention control is unclear.

### `runtime_iam.hardened.tf`
**What it does:**
Adds a policy to the ECS execution role that allows retrieving values from AWS Secrets Manager when secret injection is configured.

**Why it is needed:**
If ECS secrets are used in task definitions, the execution role needs permission to read them.

### `runtime_taskdefs.hardened.tf`
**What it does:**
Creates replacement/hardened ECS task definitions with:
- logging configuration
- extra environment variables
- optional secrets injection
- customizable CPU/memory

**Why it is needed:**
The base task definitions are a starting point. Hardened task definitions make the runtime more operationally sound.

### `runtime_services.hardened.tf`
**What it does:**
Creates hardened ECS service definitions with:
- platform version `LATEST`
- deployment circuit breaker
- ECS Exec toggle
- API health-check grace period
- load balancer attachment to the HTTPS path

**Why it is needed:**
This file upgrades the runtime behavior from “basic service declaration” to a more production-minded rollout model.

### `runtime_autoscaling.hardened.tf`
**What it does:**
Creates application autoscaling targets and CPU-based scaling policies for both API and worker services.

**Why it is needed:**
This is what allows service capacity to expand or contract automatically when utilization increases.

### `runtime_outputs.hardened.tf`
**What it does:**
Exports the hardened runtime values such as:
- listener ARNs
- hardened task definition ARNs
- log group names
- ALB DNS name

**Why it is needed:**
These values are useful for validation, observability setup, and follow-on automation.

### `prod_hardening.auto.tfvars.example`
**What it does:**
Provides a starting point for ACM ARN, log retention, autoscaling, and related production-hardening inputs.

**Why it is needed:**
This is the operator-friendly entry point for choosing production defaults without editing `.tf` files directly.

---

## C. CI/CD Layer (`infra/terraform/cicd/`)

### `cicd_variables.tf`
**What it does:**
Declares CI/CD-specific values such as:
- GitHub repository info
- Cloudflare zone IDs
- app/API DNS targets
- OIDC role names

**Why it is needed:**
It separates pipeline and DNS concerns from base runtime concerns.

### `cicd_cloudflare_provider.tf`
**What it does:**
Declares the Cloudflare provider.

**Why it is needed:**
Without it, Terraform cannot manage the Cloudflare DNS records used by the domain strategy.

### `cicd_cloudflare_dns.tf`
**What it does:**
Creates Cloudflare DNS records for:
- `app.mainecybertech.com`
- `api.mainecybertech.com`
- `app.mainecybertech.us`
- `api.mainecybertech.us`

**Why it is needed:**
This file codifies the domain routing layer so DNS is managed as infrastructure instead of only through the Cloudflare UI.

### `cicd_github_oidc.tf`
**What it does:**
Creates:
- GitHub OIDC provider in AWS
- IAM roles that GitHub Actions can assume

**Why it is needed:**
This enables GitHub Actions to access AWS using short-lived credentials instead of long-lived AWS access keys.

### `cicd_outputs.tf`
**What it does:**
Outputs the GitHub role ARNs and the expected FQDNs.

**Why it is needed:**
This helps you wire the resulting role ARNs into GitHub secrets and confirm naming.

### `cicd.auto.tfvars.example`
**What it does:**
Provides example values for:
- repository name
- AWS account ID
- Cloudflare zone IDs
- app/API DNS targets

**Why it is needed:**
This becomes the operator’s low-friction starting point for CI/CD- and DNS-related inputs.

---

## D. Examples and Support Files

### `examples/cloudflare_domain_targets.auto.tfvars.example`
**What it does:**
Provides a dedicated example for production/testing Cloudflare DNS values.

**Why it is needed:**
This is a clean place to document the exact targets without mixing them into every other example file.

### `scripts/quickstart_terraform_deploy.ps1` and `scripts/quickstart_terraform_deploy.sh`
**What they do:**
Run a basic Terraform workflow:
- fmt
- init
- validate
- plan
- apply
- output

**Why they are needed:**
They standardize local operator behavior and reduce accidental differences in how Terraform is run.
