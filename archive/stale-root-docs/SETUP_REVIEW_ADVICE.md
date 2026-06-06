# Setup Review & Recommendations

**Date**: 2026-05-30  
**Status**: Extensive infrastructure work completed ✅  
**Architecture**: Vercel (Web) + AWS ECS/Fargate (API/Worker) + Cloudflare DNS

---

## 📊 What You've Done Well ⭐

### Infrastructure & Terraform
- ✅ **Multi-provider setup** - AWS, Vercel, Supabase, Cloudflare all configured
- ✅ **Structured organization** - Separate directories for base-runtime, production-hardening, active configs, examples
- ✅ **CICD integration** - GitHub OIDC configured for secure AWS authentication
- ✅ **DNS management** - Cloudflare provider ready for domain management
- ✅ **Production hardening** - Separate hardened task definitions and security configs
- ✅ **Environment separation** - Dev/Prod terraform plans and applies

### Docker & Containerization
- ✅ **Multi-stage build** - Optimized Node Alpine Dockerfile for API
- ✅ **Production ready** - Uses `node:22-alpine`, sets `NODE_ENV=production`
- ✅ **Efficient** - Base stage builds, second stage copies artifacts only

### GitHub Actions Workflows
- ✅ **Environment protection** - Prod workflows have `environment: prod`
- ✅ **OIDC authentication** - Using `id-token: write` for AWS assume role
- ✅ **Proper permissions** - Least-privilege `contents: read`
- ✅ **ECR integration** - Docker push to AWS ECR with versioning
- ✅ **Multiple environments** - Dev, Prod, and generic workflows
- ✅ **Path-based triggers** - Only deploy when relevant files change

### Package Management
- ✅ **pnpm 10.0.0** - Latest stable version
- ✅ **Proper dependencies** - pg, supabase-cli included
- ✅ **Dev tools** - Pino, Prettier, TypeScript, Turbo configured

### .gitignore
- ✅ **Terraform coverage** - .terraform, *.tfstate, *.tfvars all ignored
- ✅ **Proper sections** - Well-organized with comments
- ✅ **Production ready** - Excludes build artifacts, logs, sensitive data

---

## ⚠️ Issues Found & Recommendations

### 🔴 CRITICAL - Must Fix Before Deploying

#### 1. **Dockerfile Error: Missing Monorepo Context**
**Problem**: Dockerfile copies `.` from single app directory but project is monorepo
```dockerfile
# ❌ WRONG (current)
COPY . .
```

**Why it fails**: When Docker builds with context from root, it copies entire monorepo, but tries to run `npm install` which won't work (package.json doesn't have dependencies for apps/api alone).

**Fix**:
```dockerfile
# ✅ CORRECT
FROM node:22-alpine AS base
WORKDIR /app

# Copy root package files
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./

# Copy only the packages needed by API
COPY packages ./packages
COPY apps/api ./apps/api

RUN corepack enable pnpm
RUN pnpm install --frozen-lockfile --filter=./apps/api

# Build the API
WORKDIR /app/apps/api
RUN pnpm build

# Runtime stage
FROM node:22-alpine
WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/package.json ./apps/api/package.json

RUN corepack enable pnpm
RUN pnpm install --frozen-lockfile --filter=./apps/api --prod

WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/main.js"]
```

**Action Required**: Update `apps/api/Dockerfile` immediately before CI/CD runs

---

#### 2. **Missing Worker Dockerfile**
**Problem**: You have API Dockerfile but no Worker Dockerfile
**Fix**: Create `apps/worker/Dockerfile`:
```dockerfile
FROM node:22-alpine AS base
WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/worker ./apps/worker

RUN corepack enable pnpm
RUN pnpm install --frozen-lockfile --filter=./apps/worker

WORKDIR /app/apps/worker
RUN pnpm build

FROM node:22-alpine
WORKDIR /app

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY --from=base /app/apps/worker/dist ./apps/worker/dist
COPY --from=base /app/apps/worker/package.json ./apps/worker/package.json

RUN corepack enable pnpm
RUN pnpm install --frozen-lockfile --filter=./apps/worker --prod

WORKDIR /app/apps/worker
ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
```

---

#### 3. **ECR Repository Not Created in Terraform**
**Problem**: GitHub Actions tries to push to ECR but repo doesn't exist
```yaml
# In api-deploy-ecs.prod.yml, line 42:
docker build -t "$REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" -f apps/api/Dockerfile .
# ❌ $ECR_REPOSITORY doesn't exist yet
```

**Fix**: Add to `infra/terraform/compute.tf`:
```hcl
# API ECR Repository
resource "aws_ecr_repository" "api" {
  name                 = "mainecybertech-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "mainecybertech-api"
    Environment = "production"
  }
}

# Worker ECR Repository
resource "aws_ecr_repository" "worker" {
  name                 = "mainecybertech-worker"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "mainecybertech-worker"
    Environment = "production"
  }
}

# Output ECR repository URLs
output "api_ecr_repository_url" {
  value = aws_ecr_repository.api.repository_url
}

output "worker_ecr_repository_url" {
  value = aws_ecr_repository.worker.repository_url
}
```

---

#### 4. **Missing GitHub Action Secrets**
**Problem**: Workflows reference secrets that may not be set
```yaml
# In api-deploy-ecs.prod.yml, line 31:
role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
```

**Required Secrets** (set in GitHub repo settings):
- `AWS_DEPLOY_ROLE_ARN` - ARN of role for GitHub Actions to assume
- `VERCEL_TOKEN` - Vercel API token for deployments
- `VERCEL_ORG_ID` - Vercel organization ID

**Action Required**: 
1. Go to repo → Settings → Secrets and variables → Actions
2. Add the 3 secrets above

---

#### 5. **ACM Certificate Not Created**
**Problem**: Variables reference `acm_certificate_arn` but it's not auto-created
```hcl
# In variables.tf, line 47:
variable "acm_certificate_arn" { description = "Existing ACM certificate ARN for HTTPS" type = string }
```

**Fix**: Add to `infra/terraform/compute.tf`:
```hcl
# Request ACM certificate for API domain
resource "aws_acm_certificate" "api" {
  domain_name       = var.api_domain  # Add this to variables
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "mainecybertech-api-cert"
  }
}

# Add to variables.tf:
variable "api_domain" {
  description = "Domain name for the API (e.g., api.example.com)"
  type        = string
}
```

And add to `terraform.tfvars.example`:
```hcl
api_domain = "api.yourdomain.com"
```

---

### 🟡 IMPORTANT - Should Fix Before Production

#### 6. **Node Version Mismatch**
**Workflows use Node 20**, **Dockerfile uses Node 22-alpine**

**Problem**: Different versions could cause inconsistencies

**Fix** - Choose one and standardize:
```yaml
# Option A: Update workflows to 22.x
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 22.x  # ← Change this

# Option B: Update Dockerfile to 20.x (more stable)
FROM node:20-alpine AS base
```

**Recommendation**: Use Node 20.x (LTS) for stability, update Dockerfile.

---

#### 7. **Missing pnpm Version Pinning in Dockerfile**
**Problem**: Dockerfile enables pnpm but doesn't pin version

```dockerfile
# ❌ Current - may break with different pnpm versions
RUN corepack enable

# ✅ Better
RUN corepack enable pnpm@10
```

**Fix**: Update both Dockerfiles:
```dockerfile
RUN corepack enable pnpm@10
```

---

#### 8. **Missing Health Check in ECS Task**
**Problem**: No health check configured in ECS tasks
**Fix**: Add to Terraform task definitions:
```hcl
healthCheck {
  command      = ["CMD-SHELL", "curl -f http://localhost:4000/health || exit 1"]
  interval     = 30
  timeout      = 5
  retries      = 3
  startPeriod  = 60
}
```

---

#### 9. **Missing Environment Variables in ECS Tasks**
**Problem**: Tasks don't have `SUPABASE_URL`, `DATABASE_URL`, etc. configured
**Fix**: Add to `runtime_services.tf`:
```hcl
environment = [
  {
    name  = "SUPABASE_URL"
    value = var.supabase_url
  },
  {
    name  = "SUPABASE_ANON_KEY"
    value = var.supabase_anon_key
  },
  {
    name  = "DATABASE_URL"
    value = var.database_url
  },
  {
    name  = "NODE_ENV"
    value = "production"
  },
]
```

And add to `variables.tf`:
```hcl
variable "supabase_url" {
  type      = string
  sensitive = true
}

variable "supabase_anon_key" {
  type      = string
  sensitive = true
}

variable "database_url" {
  type      = string
  sensitive = true
}
```

---

#### 10. **Missing Terraform State Backend**
**Problem**: No S3 backend configured for state management
**Fix**: Create `infra/terraform/backend.tf`:
```hcl
terraform {
  backend "s3" {
    bucket         = "mainecybertech-terraform-state"  # Change to your bucket name
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

**Also Create S3 bucket and DynamoDB table:**
```bash
# Run once before `terraform init`
aws s3api create-bucket --bucket mainecybertech-terraform-state --region us-east-1
aws s3api put-bucket-versioning --bucket mainecybertech-terraform-state --versioning-configuration Status=Enabled
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

---

#### 11. **Missing GitHub OIDC Trust Relationship**
**Problem**: GitHub Actions can't assume AWS role without trust configured
**Fix**: The `github-oidc.tf` should create this. Verify it includes:
```hcl
resource "aws_iam_role" "github_actions" {
  name = "github-actions-deploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:ref:refs/heads/main"
          }
        }
      }
    ]
  })
}
```

---

#### 12. **Missing API Load Balancer Listener HTTPS Rule**
**Problem**: ALB only has HTTP listener, no HTTPS redirect
**Fix**: Add to `runtime_alb.tf`:
```hcl
# HTTPS Listener (port 443)
resource "aws_lb_listener" "api_https" {
  load_balancer_arn = aws_lb.api.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

# HTTP to HTTPS Redirect
resource "aws_lb_listener" "api_http_redirect" {
  load_balancer_arn = aws_lb.api.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}
```

---

### 🟢 NICE TO HAVE - Improvements for Later

#### 13. **Add CI/CD for Worker Deployment**
**Missing**: Worker deploy workflow

**Fix**: Copy `api-deploy-ecs.prod.yml` and adapt for worker:
```yaml
name: worker-deploy-ecs-prod

on:
  push:
    branches: [main]
    paths:
      - "apps/worker/**"
      - "packages/**"

jobs:
  deploy-prod:
    runs-on: ubuntu-latest
    environment: prod
    permissions:
      contents: read
      id-token: write
    env:
      AWS_REGION: ${{ vars.AWS_REGION }}
      ECR_REPOSITORY: ${{ vars.WORKER_ECR_REPOSITORY }}
      ECS_CLUSTER: ${{ vars.ECS_CLUSTER_NAME }}
      ECS_SERVICE: ${{ vars.WORKER_ECS_SERVICE }}
      IMAGE_TAG: ${{ github.sha }}
    steps:
      # ... same as API but with worker paths
```

---

#### 14. **Add Monitoring & CloudWatch Alarms**
**Missing**: Log groups, alarms for metrics
**Fix**: Add to Terraform:
```hcl
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/mainecybertech-api"
  retention_in_days = 7
}

resource "aws_cloudwatch_metric_alarm" "api_unhealthy_hosts" {
  alarm_name          = "api-unhealthy-hosts"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 1
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
```

---

#### 15. **Add VPC Flow Logs for Security Auditing**
**Nice for**: Compliance and troubleshooting
```hcl
resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
}
```

---

#### 16. **Add Auto-Scaling Policies**
**Missing**: Scaling rules based on CPU/memory

**Fix**: Add to Terraform:
```hcl
resource "aws_appautoscaling_target" "api_target" {
  max_capacity       = 5
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "api_cpu" {
  policy_name       = "cpu-autoscaling"
  policy_type       = "TargetTrackingScaling"
  resource_id       = aws_appautoscaling_target.api_target.resource_id
  scalable_dimension = aws_appautoscaling_target.api_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.api_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

---

#### 17. **Add Secrets Manager for Sensitive Data**
**Better than**: Storing secrets in tfvars
```hcl
resource "aws_secretsmanager_secret" "api_env" {
  name = "mainecybertech/api/env"
}

resource "aws_secretsmanager_secret_version" "api_env" {
  secret_id = aws_secretsmanager_secret.api_env.id
  secret_string = jsonencode({
    SUPABASE_URL  = var.supabase_url
    DATABASE_URL  = var.database_url
  })
}
```

---

#### 18. **Add Terraform Linting to CI/CD**
**Missing**: `terraform fmt` and `tflint` in workflows

**Add to workflow**:
```yaml
- name: Terraform Format Check
  run: terraform fmt -check -recursive infra/terraform

- name: TFLint
  uses: terraform-linters/setup-tflint@v3
  with:
    tflint_version: latest
  
- run: tflint --recursive infra/terraform
```

---

## 🎯 Priority Order to Fix

### Before First Deploy (CRITICAL)
1. ❌ **Fix Dockerfile** (apps/api/Dockerfile)
2. ❌ **Add Worker Dockerfile** (apps/worker/Dockerfile)
3. ❌ **Create ECR repositories** (compute.tf)
4. ❌ **Add GitHub secrets** (GitHub UI)
5. ❌ **Fix ACM certificate** (compute.tf)

### Before Production (IMPORTANT)
6. ⚠️ **Standardize Node version** (20.x)
7. ⚠️ **Add pnpm pinning** (Dockerfiles)
8. ⚠️ **Add health checks** (runtime_taskdefs.tf)
9. ⚠️ **Set ECS environment variables** (runtime_services.tf)
10. ⚠️ **Configure Terraform state backend** (backend.tf)
11. ⚠️ **Verify GitHub OIDC trust** (github-oidc.tf)
12. ⚠️ **Add HTTPS listener rules** (runtime_alb.tf)

### Post-Launch Improvements
13. 🟢 Add worker deployment workflow
14. 🟢 Add CloudWatch monitoring
15. 🟢 Add auto-scaling policies
16. 🟢 Add Secrets Manager integration
17. 🟢 Add Terraform linting to CI/CD

---

## 📋 Next Steps Checklist

```
IMMEDIATE (Do This Today)
[ ] Fix apps/api/Dockerfile (copy monorepo structure correctly)
[ ] Create apps/worker/Dockerfile
[ ] Add ECR repositories to compute.tf
[ ] Set GitHub secrets (AWS_DEPLOY_ROLE_ARN, VERCEL_TOKEN, VERCEL_ORG_ID)
[ ] Add ACM certificate creation to compute.tf
[ ] Update Node version to 20.x (consistent)
[ ] Pin pnpm@10 in Dockerfiles

BEFORE TERRAFORM APPLY
[ ] Create Terraform S3 backend and DynamoDB table
[ ] Verify github-oidc.tf creates GitHub Actions assume role
[ ] Add environment variables to ECS task definitions
[ ] Add HTTPS listener rules to ALB
[ ] Create terraform.tfvars with your values

BEFORE FIRST PUSH
[ ] Test terraform init/plan locally
[ ] Test Docker builds locally: docker build -f apps/api/Dockerfile .
[ ] Commit and push
[ ] Monitor GitHub Actions for build success

AFTER SUCCESSFUL DEPLOY
[ ] Test /health endpoint on API
[ ] Configure Cloudflare DNS records
[ ] Test Vercel deployment
[ ] Add monitoring/alerts
[ ] Add auto-scaling rules
[ ] Load testing and optimization
```

---

## 🚀 You're 75% There!

You've built:
- ✅ Solid infrastructure foundation
- ✅ Multiple environments (dev/prod)
- ✅ Security-conscious OIDC setup
- ✅ Organized Terraform structure

Just need to:
- 🔧 Fix the Dockerfiles (monorepo context)
- 🔧 Create missing resources (ECR, ACM)
- 🔧 Add configuration (env vars, secrets)
- 🔧 Test and deploy

**Timeline**: 4-6 hours to production if you follow this plan!

---

## 💡 Questions?

If anything is unclear, check:
1. `DEPLOYMENT_PLAN_TERRAFORM_VERCEL.md` - Full deployment guide
2. AWS documentation - Provider-specific issues
3. Terraform docs - HCL syntax questions

**Good luck! You're building something great.** 🎉

