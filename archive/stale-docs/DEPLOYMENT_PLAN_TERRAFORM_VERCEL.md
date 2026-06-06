# Production Deployment Plan: Terraform + Vercel

> **⚠️ Historical planning document.** Written during initial architecture design. The infrastructure is now fully implemented in Terraform and CI/CD. See `docs/FINAL_DEPLOYMENT_OPERATIONS_HANDBOOK.md` for current operator manual and `docs/GITHUB_SECRETS_AND_VARIABLES_MATRIX.md` for required secrets.

**Date**: 2024-05-30 (historical)
**Deployment**: Vercel (Web/Preview) + AWS (API/Worker via Terraform)

---

## 🎯 Overview

Your application has three main components that require different deployment strategies:

| Component | Current | Recommended | Platform |
|-----------|---------|-------------|----------|
| **Web (Next.js)** | Incomplete | ✅ Vercel | Vercel |
| **API (Express)** | Incomplete | ✅ AWS ECS | AWS (Terraform) |
| **Worker (Node.js)** | Incomplete | ✅ AWS Fargate | AWS (Terraform) |
| **Database** | Supabase | ✅ Supabase | Supabase |

---

## 📋 Current State Analysis

### What Exists ✓
- GitHub Actions CI/CD pipelines (6 workflows)
- Docker support (Dockerfile likely needed in apps/api)
- Terraform infrastructure directory (empty - needs setup)
- Environment configurations for all apps
- Supabase migrations and configurations

### What's Incomplete ⏳
- Terraform infrastructure-as-code
- Vercel configuration for web app
- API deployment pipeline (AWS ECR/ECS)
- Worker deployment setup
- Production environment variables
- Database connection pooling setup
- CDN/SSL configuration

---

## 🏗️ Architecture Decision

### Recommended Stack

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTS (Browser)                     │
└────────────────────────┬────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │ Vercel  │ (Web App - Next.js)
                    │ CDN/SSL │
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐  ┌────────▼──────┐  ┌────▼──────┐
   │AWS ECS   │  │  Supabase     │  │ AWS SQS   │
   │(API)     │  │  (Database)   │  │ (Jobs)    │
   │Port 4000 │  │  PostgreSQL   │  │           │
   └─────────┘  └────┬──────────┘  └─────┬─────┘
                      │                   │
                 ┌────▼───────────────────▼──┐
                 │    AWS Fargate (Worker)   │
                 │  (Background Jobs)        │
                 └──────────────────────────┘
```

### Why This Stack?

**Vercel for Web**:
- ✅ Optimized for Next.js
- ✅ Automatic deployments from GitHub
- ✅ Built-in CDN and SSL
- ✅ Serverless functions for edge logic
- ✅ Preview deployments for PRs
- ✅ Easy environment variable management

**AWS for API/Worker**:
- ✅ Fine-grained control
- ✅ Cost-effective at scale
- ✅ Terraform-managed infrastructure
- ✅ Scheduled jobs support
- ✅ Integration with Supabase

**Supabase for Database**:
- ✅ Already integrated (no change needed)
- ✅ PostgreSQL managed service
- ✅ Row-level security configured
- ✅ Automatic backups

---

## 🚀 Phase 1: Vercel Web Deployment (30 min)

### Step 1.1: Create Vercel Project

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project (from root or apps/web)
cd apps/web
vercel link --project mainecybertech-portal

# Or via dashboard: https://vercel.com/new
# - Select GitHub repo
# - Select Framework: Next.js
# - Root Directory: apps/web
```

### Step 1.2: Configure Environment Variables

**In Vercel Dashboard**:
1. Go to Settings → Environment Variables
2. Add all from `apps/web/.env.example`:
    ```
    NEXT_PUBLIC_API_URL=https://api.yourdomain.com
    NODE_ENV=production
    ```

> **Note:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are no longer needed. Auth is proxied through the API.

### Step 1.3: Configure Build Settings

**Settings → Build & Development**:
- **Build Command**: `pnpm --filter web build`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `pnpm install --frozen-lockfile`

### Step 1.4: Deploy

```bash
# Deploy (from root)
vercel deploy --prod

# Or just push to main branch (auto-deploys if configured)
git push origin main
```

### Expected Result
- Web app running on Vercel domain
- Automatic deployments on git push
- Preview deployments for PRs
- SSL/HTTPS automatic

---

## 🔧 Phase 2: AWS Infrastructure with Terraform (1-2 hours)

### Step 2.1: Setup AWS Account & Credentials

```bash
# 1. Create AWS account (if needed)
# 2. Create IAM user with programmatic access
# 3. Install AWS CLI
aws --version

# 4. Configure credentials
aws configure
# Enter:
# - Access Key ID
# - Secret Access Key
# - Default region: us-east-1
# - Default format: json
```

### Step 2.2: Create Terraform Infrastructure

**File: `infra/terraform/main.tf`**
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "mainecybertech-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
}

# ECR Repository for API
resource "aws_ecr_repository" "api" {
  name                 = "mainecybertech-api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "mainecybertech-api"
    Environment = var.environment
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "mainecybertech-cluster"

  tags = {
    Name        = "mainecybertech-cluster"
    Environment = var.environment
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/mainecybertech"
  retention_in_days = 7

  tags = {
    Name        = "mainecybertech-logs"
    Environment = var.environment
  }
}

# ECS Task Definition for API
resource "aws_ecs_task_definition" "api" {
  family                   = "mainecybertech-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = "${aws_ecr_repository.api.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 4000
          hostPort      = 4000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "4000"
        },
        {
          name  = "SUPABASE_URL"
          value = var.supabase_url
        }
      ]

      secrets = [
        {
          name      = "SUPABASE_KEY"
          valueFrom = aws_secretsmanager_secret.supabase_key.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }
    }
  ])

  tags = {
    Name        = "mainecybertech-api-task"
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_lb" "api" {
  name               = "mainecybertech-alb"
  internal           = false
  load_balancer_type = "application"

  enable_deletion_protection = false

  tags = {
    Name        = "mainecybertech-alb"
    Environment = var.environment
  }
}

# Output
output "ecr_repository_url" {
  description = "ECR Repository URL"
  value       = aws_ecr_repository.api.repository_url
}

output "alb_dns_name" {
  description = "ALB DNS Name"
  value       = aws_lb.api.dns_name
}
```

**File: `infra/terraform/variables.tf`**
```hcl
variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "production"
}

variable "supabase_url" {
  description = "Supabase URL"
  type        = string
  sensitive   = true
}

variable "supabase_key" {
  description = "Supabase Service Role Key"
  type        = string
  sensitive   = true
}
```

### Step 2.3: Initialize Terraform

```bash
# 1. Create S3 state bucket
aws s3api create-bucket \
  --bucket mainecybertech-terraform-state \
  --region us-east-1

# 2. Enable versioning
aws s3api put-bucket-versioning \
  --bucket mainecybertech-terraform-state \
  --versioning-configuration Status=Enabled

# 3. Initialize Terraform
cd infra/terraform
terraform init

# 4. Plan
terraform plan -var-file="production.tfvars"

# 5. Apply
terraform apply -var-file="production.tfvars"
```

**File: `infra/terraform/production.tfvars`**
```hcl
aws_region   = "us-east-1"
environment  = "production"
supabase_url = "https://your-project.supabase.co"
supabase_key = "your-service-role-key"  # Use AWS Secrets Manager in practice
```

---

## 🐳 Phase 3: Docker & API Deployment (1 hour)

### Step 3.1: Create Dockerfile for API

**File: `apps/api/Dockerfile`**
```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy app and packages
COPY apps/api ./apps/api
COPY packages ./packages

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod

# Build API
RUN pnpm --filter api build

EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
```

### Step 3.2: Update GitHub Actions Workflow

**File: `.github/workflows/api-deploy.yml` (complete)**
```yaml
name: API Deploy

on:
  push:
    branches: [main]
    paths:
      - "apps/api/**"
      - "packages/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22

      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter api build

      # Configure AWS credentials
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole
          aws-region: us-east-1

      # Login to ECR
      - run: aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

      # Build and push Docker image
      - run: |
          docker build -t mainecybertech-api:${{ github.sha }} apps/api
          docker tag mainecybertech-api:${{ github.sha }} ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mainecybertech-api:${{ github.sha }}
          docker tag mainecybertech-api:${{ github.sha }} ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mainecybertech-api:latest
          docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mainecybertech-api:${{ github.sha }}
          docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mainecybertech-api:latest

      # Update ECS service
      - run: |
          aws ecs update-service \
            --cluster mainecybertech-cluster \
            --service mainecybertech-api \
            --force-new-deployment
```

### Step 3.3: Push to ECR and Deploy

```bash
# Build locally
docker build -t mainecybertech-api:latest apps/api

# Tag for ECR
docker tag mainecybertech-api:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mainecybertech-api:latest

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Push
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/mainecybertech-api:latest
```

---

## 🔄 Phase 4: Worker Deployment (1 hour)

### Step 4.1: Update Terraform for Fargate Worker

**Add to `infra/terraform/main.tf`**:
```hcl
# Worker ECR Repository
resource "aws_ecr_repository" "worker" {
  name = "mainecybertech-worker"

  tags = {
    Name        = "mainecybertech-worker"
    Environment = var.environment
  }
}

# Worker Task Definition
resource "aws_ecs_task_definition" "worker" {
  family                   = "mainecybertech-worker"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([
    {
      name      = "worker"
      image     = "${aws_ecr_repository.worker.repository_url}:latest"
      essential = true

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "SUPABASE_URL"
          value = var.supabase_url
        }
      ]

      secrets = [
        {
          name      = "SUPABASE_KEY"
          valueFrom = aws_secretsmanager_secret.supabase_key.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "worker"
        }
      }
    }
  ])
}

# ECS Service for Worker
resource "aws_ecs_service" "worker" {
  name            = "mainecybertech-worker"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.worker.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.worker.id]
    assign_public_ip = false
  }

  tags = {
    Name        = "mainecybertech-worker"
    Environment = var.environment
  }
}
```

### Step 4.2: Worker Dockerfile

**File: `apps/worker/Dockerfile`**
```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker ./apps/worker
COPY packages ./packages

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod

RUN pnpm --filter worker build

CMD ["node", "apps/worker/dist/main.js"]
```

---

## 📊 Phase 5: Monitoring & Logging (30 min)

### Setup CloudWatch Dashboards

```bash
# View API logs
aws logs tail /ecs/mainecybertech/api --follow

# View Worker logs
aws logs tail /ecs/mainecybertech/worker --follow
```

### Setup Alarms

```bash
# CPU Utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name mainecybertech-api-high-cpu \
  --alarm-description "Alert when API CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

---

## 📋 Pre-Deployment Checklist

### Environment Setup ✓
- [ ] AWS Account created
- [ ] IAM user with programmatic access
- [ ] AWS CLI configured locally
- [ ] Vercel account created
- [ ] GitHub token generated

### Code Preparation ✓
- [ ] GitHub repository created and pushed
- [ ] All environment variables documented
- [ ] Dockerfiles created for API and Worker
- [ ] Terraform code written

### Configuration ✓
- [ ] Supabase connection strings ready
- [ ] Database migrations tested
- [ ] API endpoints documented
- [ ] SSL certificates configured (Vercel auto-handles this)

### Verification ✓
- [ ] Local Docker builds successful
- [ ] GitHub Actions workflows configured
- [ ] Terraform plan shows expected resources
- [ ] Environment variables not committed to repo

---

## 🚀 Deployment Sequence

### Week 1: Foundation
1. **Day 1-2**: Vercel Setup (30 min)
   - Deploy Next.js web app
   - Configure environment variables
   - Test deployments

2. **Day 2-3**: AWS Infrastructure (1-2 hours)
   - Setup AWS account
   - Create Terraform infrastructure
   - Initialize state management

3. **Day 3-4**: Docker & API (1 hour)
   - Create Dockerfile for API
   - Push to ECR
   - Deploy to ECS

### Week 2: Complete & Verify
1. **Day 1**: Worker Deployment (1 hour)
   - Deploy worker to Fargate
   - Test job processing

2. **Day 2**: Monitoring (30 min)
   - Setup CloudWatch
   - Configure alarms
   - Test error notifications

3. **Day 3-5**: Testing & Optimization
   - Load testing
   - Security audit
   - Performance tuning

---

## 💰 Estimated Costs (Monthly)

| Service | Estimate | Notes |
|---------|----------|-------|
| **Vercel** | $20-50 | Pro plan + bandwidth |
| **AWS ECS (API)** | $20-30 | Fargate 0.5GB/0.25 CPU |
| **AWS Fargate (Worker)** | $15-20 | 1 GB/0.5 CPU, 24/7 |
| **AWS ECR** | $1-2 | Storage + data transfer |
| **Supabase** | $25-100 | Based on usage |
| **CloudWatch** | $5-10 | Logs & monitoring |
| **S3 (Terraform State)** | $0.50 | Minimal |
| **--** | **--** | **--** |
| **Total** | **$87-212** | Estimated range |

---

## 🔐 Security Best Practices

1. **Secrets Management**
   ```bash
   aws secretsmanager create-secret \
     --name mainecybertech/supabase-key \
     --secret-string "your-key"
   ```

2. **IAM Roles**
   - Least privilege access
   - Separate roles for API, Worker, GitHub Actions

3. **Network Security**
   - VPC with private subnets
   - Security groups restricted
   - No public database access

4. **Environment Variables**
   - Never commit `.env` files
   - Use AWS Secrets Manager
   - Rotate keys regularly

---

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Docker build fails | Check Node version, dependencies, Dockerfile syntax |
| Terraform apply fails | Check AWS credentials, region, existing resources |
| Vercel deployment fails | Check build script, environment variables, root directory |
| ECS service won't start | Check CloudWatch logs, container definitions, IAM roles |
| Database connection fails | Verify Supabase URL, API key, firewall rules |

---

## 📚 Next Steps

1. **Start with Vercel** (fastest wins)
   - Deploy web app immediately
   - Get preview deployments working
   - Verify CI/CD pipeline

2. **Then move to AWS**
   - Setup infrastructure
   - Deploy API
   - Setup monitoring

3. **Finally, complete Worker**
   - Deploy background jobs
   - Setup job queue integration
   - Test end-to-end

---

## 🆘 When to Ask for Help

- Terraform errors during `apply`
- Docker image build failures
- AWS credential/permission issues
- Vercel environment variable problems
- Database connection timeouts

---

**Status**: Deployment plan ready for execution  
**Time to Production**: 1-2 weeks  
**Next Step**: Choose start date and begin Phase 1 (Vercel)
