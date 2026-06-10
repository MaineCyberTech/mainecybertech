# Production configuration
# !!! MUST FILL — these values are required before deploying to production.
# For: app.mainecybertech.com and api.mainecybertech.com

aws_region                    = "us-east-1"
environment                   = "prod"
vercel_team_id                = "team_4ogSfijSEAKUJWAkws0G7ACT"
supabase_org_slug             = "yfonnwogmzoscruumohv"
supabase_region               = "us-east-1"
github_repo                   = "MaineCyberTech/mainecybertech"
github_repository             = "MaineCyberTech/mainecybertech"

# Production DNS targets — !!! MUST FILL all placeholder values below
cloudflare_zone_id_prod       = "MUST-FILL-cloudflare-zone-id-for-mainecybertech.com"
cloudflare_prod_app_name      = "app"
cloudflare_prod_api_name      = "api"
cloudflare_prod_app_target    = "MUST-FILL-vercel-inspect-target-for-app.mainecybertech.com"
cloudflare_prod_api_target    = "MUST-FILL-production-alb-dns-name"
cloudflare_prod_www_name      = "www"
cloudflare_prod_www_target    = "MUST-FILL-vercel-inspect-target-for-www.mainecybertech.com"
cloudflare_proxy_app_records  = true
cloudflare_proxy_api_records  = true
cloudflare_proxy_www_records  = true

# CORS origin — allow both portal and marketing domains
cors_origin                   = "https://app.mainecybertech.com,https://www.mainecybertech.com"

# API domain
api_domain                    = "api.mainecybertech.com"

# Runtime sizing
ecs_cluster_name              = "mainecybertech-cluster-prod"
api_service_name              = "mainecybertech-api-service-prod"
worker_service_name           = "mainecybertech-worker-service-prod"
api_container_port            = 4000

# Security — restrict ALB to Cloudflare IPs
alb_allowed_cidrs             = ["173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13", "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22"]

api_health_check_path         = "/health"
alb_name                      = "mct-api-alb-prod"
api_target_group_name         = "mct-api-tg-prod"

# ACM certificate for *.mainecybertech.com — !!! MUST FILL
acm_certificate_arn           = "MUST-FILL-acm-certificate-arn-for-mainecybertech.com"

# Autoscaling
api_service_desired_count     = 2
worker_service_desired_count  = 1
api_autoscaling_min_capacity  = 2
api_autoscaling_max_capacity  = 4
worker_autoscaling_min_capacity = 1
worker_autoscaling_max_capacity = 3
api_cpu_target_value          = 60
worker_cpu_target_value       = 60

enable_execute_command         = false

# Task sizing
api_task_cpu                  = "512"
api_task_memory               = "1024"
worker_task_cpu               = "256"
worker_task_memory            = "512"

# CloudWatch alarms (prod — !!! MUST FILL)
alarm_email                   = "MUST-FILL-alert-email@example.com"
slack_webhook_url             = ""
