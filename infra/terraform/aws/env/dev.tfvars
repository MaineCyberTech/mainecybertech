# Dev / testing configuration
# For: app.mainecybertech.us and api.mainecybertech.us

aws_region        = "us-east-1"
environment       = "dev"
vercel_team_id    = "team_4ogSfijSEAKUJWAkws0G7ACT"
supabase_org_slug = "yfonnwogmzoscruumohv"
supabase_region   = "us-east-1"
github_repo       = "MaineCyberTech/mainecybertech"
github_repository = "MaineCyberTech/mainecybertech"

# Supabase project — will be created by Terraform as: mainecybertech-dev

# CORS origin — allow both portal and marketing domains
cors_origin = "https://app.mainecybertech.us,https://www.mainecybertech.us"

# API domain
api_domain = "api.mainecybertech.us"

# Runtime sizing
ecs_cluster_name      = "mainecybertech-cluster-dev"
api_service_name      = "mainecybertech-api-service-dev"
worker_service_name   = "mainecybertech-worker-service-dev"
api_container_port    = 4000
api_health_check_path = "/health"
alb_name              = "mct-api-alb-dev"
api_target_group_name = "mct-api-tg-dev"

# ACM certificate for *.mainecybertech.us
acm_certificate_arn = "arn:aws:acm:us-east-1:600696219742:certificate/b4d22bc5-cdae-4ec4-b39b-39b5c58d17c9"

# Autoscaling (small for dev)
api_service_desired_count       = 1
worker_service_desired_count    = 1
api_autoscaling_min_capacity    = 1
api_autoscaling_max_capacity    = 2
worker_autoscaling_min_capacity = 1
worker_autoscaling_max_capacity = 2
api_cpu_target_value            = 60
worker_cpu_target_value         = 60

# Task sizing (small for dev)
api_task_cpu       = "256"
api_task_memory    = "512"
worker_task_cpu    = "256"
worker_task_memory = "512"

# Cloudflare — only dev/testing zone (mainecybertech.us)
# No prod zone configured yet
cloudflare_zone_id_test    = "8818fac5f101d33e556f8d971f1a3381"
cloudflare_test_app_name   = "app"
cloudflare_test_api_name   = "api"
cloudflare_test_app_target = "1aecffcd89303093.vercel-dns-017.com"
cloudflare_test_api_target = ""
cloudflare_test_www_name   = "www"
cloudflare_test_www_target = "1aecffcd89303093.vercel-dns-017.com"

# Production zone variables — leave as defaults (Terraform won't create records without zone ID)
cloudflare_zone_id_prod    = ""
cloudflare_prod_app_target = ""
cloudflare_prod_api_target = ""
cloudflare_prod_www_target = ""

cloudflare_proxy_app_records = true
cloudflare_proxy_api_records = false

# JSM integration (for public contact form → JSM ticket)
# jsm_domain                   = "mainecybertech.atlassian.net"
# jsm_servicedesk_id           = "1"
# jsm_request_type_id          = "1"

# Public webhook endpoints (optional — leave empty to skip)
# public_traffic_webhook_url   = "https://defaulteddb17c0b7df464fa533831123c737.8d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/bdd61af56bc34162aed9f6f4dd67c8fa/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=lrjntubK7vcY-tos_KWK6TnumvIaUiXxxfbTBrXxSFU"
# public_lead_webhook_url      = "https://defaulteddb17c0b7df464fa533831123c737.8d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3451032fc05f4ab3a90e6a247ed82eec/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=-owj-uxBea8r9I3Y-Uw7QvG5L5NjBj6Gh8jaoD8spTk"

# CloudWatch alarms (dev — email only, no Slack)
alarm_email       = ""
slack_webhook_url = ""
