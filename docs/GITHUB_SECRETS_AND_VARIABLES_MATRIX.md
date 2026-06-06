# GitHub Secrets and Variables Matrix

## Recommended GitHub Environments
- `dev` — Dev deployments (no approval required)
- `prod` — Prod Terraform and Supabase migrations
- `prod-approval` — Prod deployment approval gate (requires 1+ reviewers)

Use environment-scoped values wherever possible.

## Secrets required by Terraform workflows
| Secret | Dev | Prod | Purpose |
|---|---|---|---|
| `AWS_TERRAFORM_ROLE_ARN` | yes | yes | AWS OIDC role used by Terraform plan/apply |
| `CLOUDFLARE_API_TOKEN` | yes | yes | Cloudflare provider authentication |
| `TF_VAR_DB_PASSWORD` | yes | yes | Terraform variable injection for database password |
| `VERCEL_API_TOKEN` | yes | yes | Vercel provider authentication for Terraform |
| `SUPABASE_ACCESS_TOKEN` | yes | yes | Supabase provider authentication |

## Secrets required by deployment workflows
| Secret | Dev | Prod | Purpose |
|---|---|---|---|
| `AWS_DEPLOY_ROLE_ARN` | yes | yes | AWS OIDC role used by API/worker deployment workflows |
| `VERCEL_TOKEN` | yes | yes | Vercel CLI token used by deploy workflows |

## Repository or environment variables required by API/worker workflows
| Variable | Dev | Prod | Purpose |
|---|---|---|---|
| `AWS_REGION` | yes | yes | AWS region |
| `ECS_CLUSTER_NAME` | yes | yes | ECS cluster name |
| `API_ECS_SERVICE` | yes | yes | API ECS service name |
| `WORKER_ECS_SERVICE` | yes | yes | Worker ECS service name |
| `API_ECR_REPOSITORY` | yes | yes | API ECR repository name |
| `WORKER_ECR_REPOSITORY` | yes | yes | Worker ECR repository name |
| `SUPABASE_PROJECT_REF` | yes | yes | Supabase project reference for migrations |

## SSM Parameter Store Secrets (Terraform-managed)

These secrets are stored in AWS SSM Parameter Store under `/mainecybertech/${environment}/` and injected into ECS task definitions. Set via Terraform variables (leave empty to skip optional integrations).

### Core (always required)
| SSM Path | TF Variable | Type | Injected To | Purpose |
|----------|-------------|------|-------------|---------|
| `/supabase/url` | `supabase_url` (computed) | String | API, Worker | Supabase project URL |
| `/supabase/anon-key` | `supabase_anon_key` | SecureString | API, Worker | Supabase anon key |
| `/supabase/service-role-key` | `supabase_service_role_key` | SecureString | API | Supabase service role key |
| `/api/jwt-secret` | `jwt_secret` | SecureString | API | JWT signing secret |
| `/api/cors-origin` | `cors_origin` | String | API | CORS allowed origin |
| `/database/url` | `db_password` (computed) | SecureString | API, Worker | PostgreSQL connection string |
| `/worker/sqs-queue-url` | `sqs_queue_url` (computed) | String | Worker | SQS queue URL |

### Integration Secrets (optional — set TF variables to skip)
| SSM Path | TF Variable | Type | Injected To | Purpose |
|----------|-------------|------|-------------|---------|
| `/stripe/secret-key` | `stripe_secret_key` | SecureString | API, Worker | Stripe API key for billing sync |
| `/sentry/dsn` | `sentry_dsn` | SecureString | API, Worker | Sentry DSN for error tracking |
| `/smtp/host` | `smtp_host` | String | API, Worker | SMTP host for email |
| `/smtp/port` | `smtp_port` | String | API, Worker | SMTP port (default 587) |
| `/smtp/user` | `smtp_user` | SecureString | API, Worker | SMTP username |
| `/smtp/pass` | `smtp_pass` | SecureString | API, Worker | SMTP password |
| `/smtp/from` | `email_from` | String | API, Worker | From address for outgoing email |
| `/jira/base-url` | `jira_base_url` | String | Worker | Jira instance URL |
| `/jira/email` | `jira_email` | String | Worker | Jira user email |
| `/jira/api-token` | `jira_api_token` | SecureString | Worker | Jira API token |
| `/jsm/base-url` | `jsm_base_url` | String | Worker | JSM instance URL |
| `/jsm/email` | `jsm_email` | String | Worker | JSM user email |
| `/jsm/api-token` | `jsm_api_token` | SecureString | Worker | JSM API token |
| `/m365/tenant-id` | `m365_tenant_id` | String | Worker | Microsoft 365 tenant ID |
| `/m365/client-id` | `m365_client_id` | String | Worker | M365 app client ID |
| `/m365/client-secret` | `m365_client_secret` | SecureString | Worker | M365 app client secret |
| `/api/base-url` | `api_base_url` | String | Worker | Public API URL for webhook callbacks |

All optional secrets use `count` in Terraform — when the variable is empty, the SSM parameter is not created and ECS injection is skipped.

## Repository or environment variables required by Terraform workflows
| Variable | Dev | Prod | Purpose |
|---|---|---|---|
| `TF_BACKEND_CONFIG` | yes | yes | Backend config file path, e.g. `env/backend.dev.hcl` or `env/backend.prod.hcl` |
| `TF_VAR_FILE` | yes | yes | Var file path, e.g. `env/dev.tfvars` or `env/prod.tfvars` |

## Recommended environment-specific values
### Dev/testing
- `TF_BACKEND_CONFIG=env/backend.dev.hcl`
- `TF_VAR_FILE=env/dev.tfvars`
- `ECS_CLUSTER_NAME` points to the testing cluster
- `API_ECS_SERVICE` points to the testing API service
- `WORKER_ECS_SERVICE` points to the testing worker service
- `VERCEL_TOKEN` should be authorized for the testing/non-production project usage you want
- `SUPABASE_PROJECT_REF` points to the dev Supabase project

### Production
- `TF_BACKEND_CONFIG=env/backend.prod.hcl`
- `TF_VAR_FILE=env/prod.tfvars`
- `ECS_CLUSTER_NAME` points to the production cluster
- `API_ECS_SERVICE` points to the production API service
- `WORKER_ECS_SERVICE` points to the production worker service
- `VERCEL_TOKEN` should be authorized for production deployment
- `SUPABASE_PROJECT_REF` points to the production Supabase project

## GitHub Environment Configuration Steps

1. **Create environments** in GitHub Settings → Environments:
   - `dev` — no protection rules
   - `prod` — no protection rules
   - `prod-approval` — add Required reviewers (1+)

2. **Add secrets** to the appropriate environment scopes (or repo-wide):
   - `AWS_TERRAFORM_ROLE_ARN` — from Terraform OIDC setup
   - `AWS_DEPLOY_ROLE_ARN` — from Terraform OIDC setup
   - `CLOUDFLARE_API_TOKEN` — from Cloudflare dashboard
   - `VERCEL_API_TOKEN` — from Vercel dashboard
   - `VERCEL_TOKEN` — from Vercel dashboard
   - `SUPABASE_ACCESS_TOKEN` — from Supabase account settings
   - `TF_VAR_DB_PASSWORD` — your Supabase database password

3. **Add variables** to the appropriate environment scopes (or repo-wide):
   - `AWS_REGION`
   - `ECS_CLUSTER_NAME`, `API_ECS_SERVICE`, `WORKER_ECS_SERVICE`
   - `API_ECR_REPOSITORY`, `WORKER_ECR_REPOSITORY`
   - `TF_BACKEND_CONFIG`, `TF_VAR_FILE`
   - `SUPABASE_PROJECT_REF`
