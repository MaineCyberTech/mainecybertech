#############################################
# Global variables for the final active root
#############################################

variable "environment" {
  description = "Deployment environment (dev or prod). Used for resource naming and state separation."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be dev or prod."
  }
}

variable "aws_region" {
  description = "AWS Region to deploy to"
  type        = string
  default     = "us-east-1"
}

variable "vercel_team_id" {
  description = "Your Vercel Team ID"
  type        = string
}

variable "supabase_org_slug" {
  description = "Your Supabase Organization Slug"
  type        = string
}

variable "supabase_region" {
  description = "Supabase deployment region (e.g., us-east-1, us-west-1)"
  type        = string
  default     = "us-east-1"
}

variable "supabase_anon_key" {
  description = "Supabase publishable/anon key"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Supabase service role key (admin access)"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "The password for the Supabase database"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret for the API (min 32 chars in production)"
  type        = string
  sensitive   = true
}

variable "cors_origin" {
  description = "Allowed CORS origin(s) for the API; comma-separated for multiple (e.g. https://app.mainecybertech.com,https://www.mainecybertech.com)"
  type        = string
  sensitive   = true
}

variable "github_repo" {
  description = "GitHub repository (e.g., username/repo)"
  type        = string
}

variable "api_domain" {
  description = "Domain name for the API (e.g., api.example.com)"
  type        = string
}

# Runtime and naming
variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
  default     = "mainecybertech-cluster"
}
variable "api_service_name" {
  description = "Name of the ECS service for the API"
  type        = string
  default     = "mainecybertech-api-service"
}
variable "worker_service_name" {
  description = "Name of the ECS service for the worker"
  type        = string
  default     = "mainecybertech-worker-service"
}
variable "api_service_desired_count" {
  description = "Desired task count for the API service"
  type        = number
  default     = 1
}
variable "worker_service_desired_count" {
  description = "Desired task count for the worker service"
  type        = number
  default     = 1
}
variable "api_container_port" {
  description = "Port exposed by the API container"
  type        = number
  default     = 4000
}
variable "alb_name" {
  description = "Name of the public ALB"
  type        = string
  default     = "mct-api-alb"
}
variable "api_target_group_name" {
  description = "Name of the API target group"
  type        = string
  default     = "mct-api-tg"
}

# Hardening and HTTPS
variable "api_listener_http_port" {
  description = "Public HTTP listener port"
  type        = number
  default     = 80
}
variable "api_listener_https_port" {
  description = "Public HTTPS listener port"
  type        = number
  default     = 443
}
variable "api_health_check_path" {
  description = "ALB health check path"
  type        = string
  default     = "/health"
}
variable "alb_allowed_cidrs" {
  description = "CIDR blocks allowed to reach the ALB (restrict to Cloudflare IPs in production: https://www.cloudflare.com/ips/)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
variable "acm_certificate_arn" {
  description = "Existing ACM certificate ARN for HTTPS"
  type        = string
}
variable "api_task_cpu" {
  description = "CPU units for the hardened API task definition"
  type        = string
  default     = "256"
}
variable "api_task_memory" {
  description = "Memory (MiB) for the hardened API task definition"
  type        = string
  default     = "512"
}
variable "worker_task_cpu" {
  description = "CPU units for the hardened worker task definition"
  type        = string
  default     = "256"
}
variable "worker_task_memory" {
  description = "Memory (MiB) for the hardened worker task definition"
  type        = string
  default     = "512"
}
variable "enable_execute_command" {
  description = "Enable ECS Exec on services (set to false in production)"
  type        = bool
  default     = false
}
variable "api_health_check_grace_period_seconds" {
  description = "Grace period before ECS evaluates ALB health checks"
  type        = number
  default     = 60
}
variable "api_log_retention_days" {
  description = "CloudWatch retention days for API logs"
  type        = number
  default     = 30
}
variable "worker_log_retention_days" {
  description = "CloudWatch retention days for worker logs"
  type        = number
  default     = 30
}
variable "log_group_prefix" {
  description = "Prefix used for CloudWatch log groups"
  type        = string
  default     = "/mainecybertech"
}
variable "api_extra_environment" {
  description = "Additional environment variables for the API container"
  type        = list(object({ name = string, value = string }))
  default     = []
}
variable "worker_extra_environment" {
  description = "Additional environment variables for the worker container"
  type        = list(object({ name = string, value = string }))
  default     = []
}
variable "api_secret_environment" {
  description = "Optional ECS secret mappings for the API container"
  type        = list(object({ name = string, valueFrom = string }))
  default     = []
}
variable "worker_secret_environment" {
  description = "Optional ECS secret mappings for the worker container"
  type        = list(object({ name = string, valueFrom = string }))
  default     = []
}
variable "enable_service_autoscaling" {
  description = "Enable autoscaling for the ECS services"
  type        = bool
  default     = true
}
variable "api_autoscaling_min_capacity" {
  description = "Minimum API task count"
  type        = number
  default     = 1
}
variable "api_autoscaling_max_capacity" {
  description = "Maximum API task count"
  type        = number
  default     = 3
}
variable "worker_autoscaling_min_capacity" {
  description = "Minimum worker task count"
  type        = number
  default     = 1
}
variable "worker_autoscaling_max_capacity" {
  description = "Maximum worker task count"
  type        = number
  default     = 3
}
variable "api_cpu_target_value" {
  description = "CPU target for API autoscaling"
  type        = number
  default     = 60
}
variable "worker_cpu_target_value" {
  description = "CPU target for worker autoscaling"
  type        = number
  default     = 60
}

# CloudWatch alarms
variable "alarm_email" {
  description = "Email address for alarm notifications (leave empty to skip)"
  type        = string
  default     = ""
}
variable "slack_webhook_url" {
  description = "Slack webhook URL for alarm notifications (leave empty to skip)"
  type        = string
  sensitive   = true
  default     = ""
}

# Cloudflare DNS
variable "cloudflare_zone_id_prod" {
  description = "Cloudflare zone ID for mainecybertech.com"
  type        = string
}
variable "cloudflare_zone_id_test" {
  description = "Cloudflare zone ID for mainecybertech.us"
  type        = string
}
variable "cloudflare_prod_app_name" {
  description = "Production app hostname label"
  type        = string
  default     = "app"
}
variable "cloudflare_prod_api_name" {
  description = "Production API hostname label"
  type        = string
  default     = "api"
}
variable "cloudflare_test_app_name" {
  description = "Testing app hostname label"
  type        = string
  default     = "app"
}
variable "cloudflare_test_api_name" {
  description = "Testing API hostname label"
  type        = string
  default     = "api"
}
variable "cloudflare_prod_app_target" {
  description = "CNAME target for app.mainecybertech.com"
  type        = string
}
variable "cloudflare_prod_api_target" {
  description = "CNAME target for api.mainecybertech.com"
  type        = string
}
variable "cloudflare_test_app_target" {
  description = "CNAME target for app.mainecybertech.us"
  type        = string
}
variable "cloudflare_test_api_target" {
  description = "CNAME target for api.mainecybertech.us"
  type        = string
}
variable "cloudflare_proxy_app_records" {
  description = "Whether Cloudflare should proxy app records"
  type        = bool
  default     = true
}
variable "cloudflare_proxy_api_records" {
  description = "Whether Cloudflare should proxy API records"
  type        = bool
  default     = true
}
variable "cloudflare_prod_www_name" {
  description = "Production www marketing hostname label"
  type        = string
  default     = "www"
}
variable "cloudflare_test_www_name" {
  description = "Testing www marketing hostname label"
  type        = string
  default     = "www"
}
variable "cloudflare_prod_www_target" {
  description = "CNAME target for www.mainecybertech.com"
  type        = string
  default     = "cname.vercel-dns.com"
}
variable "cloudflare_test_www_target" {
  description = "CNAME target for www.mainecybertech.us"
  type        = string
  default     = "cname.vercel-dns.com"
}

# GitHub OIDC
variable "github_repository" {
  description = "GitHub repository in owner/name format"
  type        = string
}
variable "github_default_branch" {
  description = "Default branch allowed to assume GitHub OIDC roles"
  type        = string
  default     = "main"
}
variable "github_oidc_role_name_terraform" {
  description = "Role name used by GitHub Actions for Terraform operations"
  type        = string
  default     = "github-actions-terraform"
}
variable "github_oidc_role_name_deploy" {
  description = "Role name used by GitHub Actions for deployment operations"
  type        = string
  default     = "github-actions-deploy"
}

# Integration secrets (optional — leave empty to skip)
variable "stripe_secret_key" {
  description = "Stripe secret API key (leave empty to skip)"
  type        = string
  sensitive   = true
  default     = ""
}
variable "sentry_dsn" {
  description = "Sentry DSN for error tracking (leave empty to skip)"
  type        = string
  sensitive   = true
  default     = ""
}
variable "smtp_host" {
  description = "SMTP host for email sending (leave empty to skip)"
  type        = string
  default     = ""
}
variable "smtp_port" {
  description = "SMTP port"
  type        = string
  default     = "587"
}
variable "smtp_user" {
  description = "SMTP username"
  type        = string
  sensitive   = true
  default     = ""
}
variable "smtp_pass" {
  description = "SMTP password"
  type        = string
  sensitive   = true
  default     = ""
}
variable "email_from" {
  description = "From address for outgoing emails"
  type        = string
  default     = "noreply@mainecybertech.com"
}
variable "jira_base_url" {
  description = "Jira instance base URL (leave empty to skip)"
  type        = string
  default     = ""
}
variable "jira_email" {
  description = "Jira user email"
  type        = string
  default     = ""
}
variable "jira_api_token" {
  description = "Jira API token"
  type        = string
  sensitive   = true
  default     = ""
}
variable "jsm_base_url" {
  description = "JSM instance base URL (leave empty to skip)"
  type        = string
  default     = ""
}
variable "jsm_email" {
  description = "JSM user email"
  type        = string
  default     = ""
}
variable "jsm_api_token" {
  description = "JSM API token"
  type        = string
  sensitive   = true
  default     = ""
}
variable "m365_tenant_id" {
  description = "Microsoft 365 tenant ID (leave empty to skip)"
  type        = string
  default     = ""
}
variable "m365_client_id" {
  description = "Microsoft 365 app client ID"
  type        = string
  default     = ""
}
variable "m365_client_secret" {
  description = "Microsoft 365 app client secret"
  type        = string
  sensitive   = true
  default     = ""
}
variable "api_base_url" {
  description = "Public API base URL for webhook callbacks (leave empty to skip)"
  type        = string
  default     = ""
}

