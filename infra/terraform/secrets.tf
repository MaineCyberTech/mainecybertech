#############################################
# SSM Parameter Store for application secrets
#############################################

locals {
  ssm_prefix = "/mainecybertech/${var.environment}"
}

resource "aws_ssm_parameter" "supabase_url" {
  name        = "${local.ssm_prefix}/supabase/url"
  description = "Supabase project URL"
  type        = "String"
  value       = local.supabase_endpoint

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_ssm_parameter" "supabase_anon_key" {
  name        = "${local.ssm_prefix}/supabase/anon-key"
  description = "Supabase anonymous key"
  type        = "SecureString"
  value       = var.supabase_anon_key

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_ssm_parameter" "supabase_service_role_key" {
  name        = "${local.ssm_prefix}/supabase/service-role-key"
  description = "Supabase service role key"
  type        = "SecureString"
  value       = var.supabase_service_role_key

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_ssm_parameter" "jwt_secret" {
  name        = "${local.ssm_prefix}/api/jwt-secret"
  description = "JWT signing secret for the API"
  type        = "SecureString"
  value       = var.jwt_secret

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_ssm_parameter" "cors_origin" {
  name        = "${local.ssm_prefix}/api/cors-origin"
  description = "CORS origin for the API"
  type        = "String"
  value       = var.cors_origin

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_ssm_parameter" "database_url" {
  name        = "${local.ssm_prefix}/database/url"
  description = "PostgreSQL connection string"
  type        = "SecureString"
  value       = "postgres://postgres:${var.db_password}@${local.supabase_db_host}:5432/postgres"

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_ssm_parameter" "sqs_queue_url" {
  name        = "${local.ssm_prefix}/worker/sqs-queue-url"
  description = "SQS queue URL for the worker"
  type        = "String"
  value       = aws_sqs_queue.jobs_queue.url

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# =========================================================
# Integration secrets (optional — skipped when empty)
# =========================================================

resource "aws_ssm_parameter" "stripe_secret_key" {
  count       = var.stripe_secret_key != "" ? 1 : 0
  name        = "${local.ssm_prefix}/stripe/secret-key"
  description = "Stripe secret API key"
  type        = "SecureString"
  value       = var.stripe_secret_key
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "sentry_dsn" {
  count       = var.sentry_dsn != "" ? 1 : 0
  name        = "${local.ssm_prefix}/sentry/dsn"
  description = "Sentry DSN for error tracking"
  type        = "SecureString"
  value       = var.sentry_dsn
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "smtp_host" {
  count       = var.smtp_host != "" ? 1 : 0
  name        = "${local.ssm_prefix}/smtp/host"
  description = "SMTP host for email sending"
  type        = "String"
  value       = var.smtp_host
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "smtp_port" {
  count       = var.smtp_host != "" ? 1 : 0
  name        = "${local.ssm_prefix}/smtp/port"
  description = "SMTP port"
  type        = "String"
  value       = var.smtp_port
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "smtp_user" {
  count       = var.smtp_host != "" ? 1 : 0
  name        = "${local.ssm_prefix}/smtp/user"
  description = "SMTP username"
  type        = "SecureString"
  value       = var.smtp_user
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "smtp_pass" {
  count       = var.smtp_host != "" ? 1 : 0
  name        = "${local.ssm_prefix}/smtp/pass"
  description = "SMTP password"
  type        = "SecureString"
  value       = var.smtp_pass
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "email_from" {
  count       = var.smtp_host != "" ? 1 : 0
  name        = "${local.ssm_prefix}/smtp/from"
  description = "From address for outgoing emails"
  type        = "String"
  value       = var.email_from
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "jira_base_url" {
  count       = var.jira_base_url != "" ? 1 : 0
  name        = "${local.ssm_prefix}/jira/base-url"
  description = "Jira instance base URL"
  type        = "String"
  value       = var.jira_base_url
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "jira_email" {
  count       = var.jira_base_url != "" ? 1 : 0
  name        = "${local.ssm_prefix}/jira/email"
  description = "Jira user email"
  type        = "String"
  value       = var.jira_email
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "jira_api_token" {
  count       = var.jira_base_url != "" ? 1 : 0
  name        = "${local.ssm_prefix}/jira/api-token"
  description = "Jira API token"
  type        = "SecureString"
  value       = var.jira_api_token
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "jsm_base_url" {
  count       = var.jsm_base_url != "" ? 1 : 0
  name        = "${local.ssm_prefix}/jsm/base-url"
  description = "JSM instance base URL"
  type        = "String"
  value       = var.jsm_base_url
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "jsm_email" {
  count       = var.jsm_base_url != "" ? 1 : 0
  name        = "${local.ssm_prefix}/jsm/email"
  description = "JSM user email"
  type        = "String"
  value       = var.jsm_email
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "jsm_api_token" {
  count       = var.jsm_base_url != "" ? 1 : 0
  name        = "${local.ssm_prefix}/jsm/api-token"
  description = "JSM API token"
  type        = "SecureString"
  value       = var.jsm_api_token
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "m365_tenant_id" {
  count       = var.m365_tenant_id != "" ? 1 : 0
  name        = "${local.ssm_prefix}/m365/tenant-id"
  description = "Microsoft 365 tenant ID"
  type        = "String"
  value       = var.m365_tenant_id
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "m365_client_id" {
  count       = var.m365_tenant_id != "" ? 1 : 0
  name        = "${local.ssm_prefix}/m365/client-id"
  description = "Microsoft 365 app client ID"
  type        = "String"
  value       = var.m365_client_id
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "m365_client_secret" {
  count       = var.m365_tenant_id != "" ? 1 : 0
  name        = "${local.ssm_prefix}/m365/client-secret"
  description = "Microsoft 365 app client secret"
  type        = "SecureString"
  value       = var.m365_client_secret
  tags        = { Environment = var.environment }
}

resource "aws_ssm_parameter" "api_base_url" {
  count       = var.api_base_url != "" ? 1 : 0
  name        = "${local.ssm_prefix}/api/base-url"
  description = "Public API base URL for webhook callbacks"
  type        = "String"
  value       = var.api_base_url
  tags        = { Environment = var.environment }
}