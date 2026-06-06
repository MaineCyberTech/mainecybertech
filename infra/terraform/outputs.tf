#############################################
# Outputs
#############################################

output "environment" {
  description = "Deployment environment"
  value       = var.environment
}

output "aws_region" {
  description = "AWS region used by this deployment"
  value       = var.aws_region
}

# Network
output "vpc_id" {
  description = "ID of the application VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs created by the VPC module"
  value       = module.vpc.public_subnets
}

output "private_subnet_ids" {
  description = "Private subnet IDs created by the VPC module"
  value       = module.vpc.private_subnets
}

# Security groups
output "api_security_group_id" {
  description = "Security group attached to the API tasks"
  value       = aws_security_group.api_tasks.id
}

output "alb_security_group_id" {
  description = "Security group attached to the ALB"
  value       = aws_security_group.alb.id
}

output "worker_security_group_id" {
  description = "Security group attached to worker tasks"
  value       = aws_security_group.worker_tasks.id
}

# IAM
output "ecs_execution_role_arn" {
  description = "IAM role ARN used by ECS task execution"
  value       = aws_iam_role.ecs_execution.arn
}

# Queues
output "jobs_queue_url" {
  description = "SQS FIFO queue URL for background jobs"
  value       = aws_sqs_queue.jobs_queue.url
}

# ECR
output "api_ecr_repository_url" {
  description = "API ECR repository URL"
  value       = aws_ecr_repository.api.repository_url
}

output "worker_ecr_repository_url" {
  description = "Worker ECR repository URL"
  value       = aws_ecr_repository.worker.repository_url
}

# ECS
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "api_service_name" {
  description = "API ECS service name"
  value       = aws_ecs_service.api.name
}

output "worker_service_name" {
  description = "Worker ECS service name"
  value       = aws_ecs_service.worker.name
}

# ALB
output "api_alb_dns_name" {
  description = "DNS name of the public API ALB"
  value       = aws_lb.api.dns_name
}

output "api_https_listener_arn" {
  description = "HTTPS listener ARN for the public API ALB"
  value       = aws_lb_listener.api_https.arn
}

# Task definitions
output "api_runtime_task_definition_arn" {
  description = "Hardened API task definition ARN"
  value       = aws_ecs_task_definition.api_runtime.arn
}

output "worker_runtime_task_definition_arn" {
  description = "Hardened worker task definition ARN"
  value       = aws_ecs_task_definition.worker_runtime.arn
}

# CloudWatch
output "api_log_group_name" {
  description = "CloudWatch log group name for the API container"
  value       = aws_cloudwatch_log_group.api.name
}

output "worker_log_group_name" {
  description = "CloudWatch log group name for the worker container"
  value       = aws_cloudwatch_log_group.worker.name
}

# Supabase
output "supabase_project_id" {
  description = "Supabase project ID"
  value       = supabase_project.main_db.id
}

output "supabase_endpoint" {
  description = "Supabase project endpoint URL"
  value       = local.supabase_endpoint
}

output "supabase_documents_bucket" {
  description = "Name of the Supabase documents storage bucket"
  value       = supabase_storage_bucket.documents.name
}

output "supabase_avatars_bucket" {
  description = "Name of the Supabase avatars storage bucket"
  value       = supabase_storage_bucket.avatars.name
}

# SSM parameters
output "ssm_supabase_url_arn" {
  description = "SSM parameter ARN for SUPABASE_URL"
  value       = aws_ssm_parameter.supabase_url.arn
}

output "ssm_supabase_anon_key_arn" {
  description = "SSM parameter ARN for SUPABASE_ANON_KEY"
  value       = aws_ssm_parameter.supabase_anon_key.arn
}

output "ssm_supabase_service_role_key_arn" {
  description = "SSM parameter ARN for SUPABASE_SERVICE_ROLE_KEY"
  value       = aws_ssm_parameter.supabase_service_role_key.arn
}

output "ssm_jwt_secret_arn" {
  description = "SSM parameter ARN for JWT_SECRET"
  value       = aws_ssm_parameter.jwt_secret.arn
}

output "ssm_cors_origin_arn" {
  description = "SSM parameter ARN for CORS_ORIGIN"
  value       = aws_ssm_parameter.cors_origin.arn
}

output "ssm_database_url_arn" {
  description = "SSM parameter ARN for DATABASE_URL"
  value       = aws_ssm_parameter.database_url.arn
}

output "ssm_sqs_queue_url_arn" {
  description = "SSM parameter ARN for SQS_QUEUE_URL"
  value       = aws_ssm_parameter.sqs_queue_url.arn
}

# Vercel
output "vercel_project_id" {
  description = "Vercel project ID"
  value       = vercel_project.web_app.id
}

# GitHub OIDC
output "github_terraform_role_arn" {
  description = "IAM role ARN for GitHub Actions Terraform workflows"
  value       = aws_iam_role.github_terraform.arn
}

output "github_deploy_role_arn" {
  description = "IAM role ARN for GitHub Actions deployment workflows"
  value       = aws_iam_role.github_deploy.arn
}

# Cloudflare DNS
output "cloudflare_prod_app_fqdn" {
  description = "Production app hostname"
  value       = "${var.cloudflare_prod_app_name}.mainecybertech.com"
}

output "cloudflare_prod_api_fqdn" {
  description = "Production API hostname"
  value       = "${var.cloudflare_prod_api_name}.mainecybertech.com"
}

output "cloudflare_test_app_fqdn" {
  description = "Testing app hostname"
  value       = "${var.cloudflare_test_app_name}.mainecybertech.us"
}

output "cloudflare_test_api_fqdn" {
  description = "Testing API hostname"
  value       = "${var.cloudflare_test_api_name}.mainecybertech.us"
}

output "cloudflare_prod_www_fqdn" {
  description = "Production www marketing hostname"
  value       = "${var.cloudflare_prod_www_name}.mainecybertech.com"
}

output "cloudflare_test_www_fqdn" {
  description = "Testing www marketing hostname"
  value       = "${var.cloudflare_test_www_name}.mainecybertech.us"
}

output "vercel_www_prod_domain" {
  description = "Vercel www production domain"
  value       = vercel_project_domain.www_prod.domain
}

output "vercel_www_test_domain" {
  description = "Vercel www testing domain"
  value       = vercel_project_domain.www_test.domain
}

output "vercel_app_prod_domain" {
  description = "Vercel app production domain"
  value       = vercel_project_domain.app_prod.domain
}

output "vercel_app_test_domain" {
  description = "Vercel app testing domain"
  value       = vercel_project_domain.app_test.domain
}