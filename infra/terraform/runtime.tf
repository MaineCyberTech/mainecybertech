#############################################
# Final active runtime layer
#
# This file combines:
# - ECS cluster
# - ALB + target group + listeners
# - worker and ALB security groups
# - CloudWatch log groups
# - hardened task definitions
# - ECS services
# - autoscaling
#############################################

# Shared ECS cluster for API and worker services.
resource "aws_ecs_cluster" "main" {
  name = var.ecs_cluster_name
}

# Public ALB security group.
resource "aws_security_group" "alb" {
  name        = "mainecybertech-alb-sg"
  description = "Public ALB security group"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description = "Allow inbound HTTP"
    from_port   = var.api_listener_http_port
    to_port     = var.api_listener_http_port
    protocol    = "tcp"
    cidr_blocks = var.alb_allowed_cidrs
  }

  ingress {
    description = "Allow inbound HTTPS"
    from_port   = var.api_listener_https_port
    to_port     = var.api_listener_https_port
    protocol    = "tcp"
    cidr_blocks = var.alb_allowed_cidrs
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Worker tasks remain private and only need outbound access.
resource "aws_security_group" "worker_tasks" {
  name        = "mainecybertech-worker-sg"
  description = "Egress-only security group for worker tasks"
  vpc_id      = module.vpc.vpc_id

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Allow only the ALB security group to reach the API task SG.
resource "aws_security_group_rule" "api_from_alb" {
  type                     = "ingress"
  security_group_id        = aws_security_group.api_tasks.id
  from_port                = var.api_container_port
  to_port                  = var.api_container_port
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  description              = "Allow ingress from the ALB to the API tasks"
}

# Public ALB for the API.
resource "aws_lb" "api" {
  name               = var.alb_name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
}

resource "aws_lb_target_group" "api" {
  name        = var.api_target_group_name
  port        = var.api_container_port
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = var.api_health_check_path
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

# Redirect HTTP to HTTPS.
resource "aws_lb_listener" "api_http" {
  load_balancer_arn = aws_lb.api.arn
  port              = var.api_listener_http_port
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = tostring(var.api_listener_https_port)
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "api_https" {
  load_balancer_arn = aws_lb.api.arn
  port              = var.api_listener_https_port
  protocol          = "HTTPS"
  certificate_arn   = var.acm_certificate_arn
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "${var.log_group_prefix}/ecs/api"
  retention_in_days = var.api_log_retention_days
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "${var.log_group_prefix}/ecs/worker"
  retention_in_days = var.worker_log_retention_days
}

locals {
  api_base_environment = [
    { name = "NODE_ENV", value = "production" },
    { name = "API_PORT", value = tostring(var.api_container_port) },
    { name = "SUPABASE_URL", value = local.supabase_endpoint }
  ]

  api_secrets = [
    { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.database_url.arn },
    { name = "SUPABASE_ANON_KEY", valueFrom = aws_ssm_parameter.supabase_anon_key.arn },
    { name = "SUPABASE_SERVICE_ROLE_KEY", valueFrom = aws_ssm_parameter.supabase_service_role_key.arn },
    { name = "JWT_SECRET", valueFrom = aws_ssm_parameter.jwt_secret.arn },
    { name = "CORS_ORIGIN", valueFrom = aws_ssm_parameter.cors_origin.arn },
  ]

  api_optional_secrets = [
    { name = "STRIPE_SECRET_KEY", param = aws_ssm_parameter.stripe_secret_key },
    { name = "SENTRY_DSN", param = aws_ssm_parameter.sentry_dsn },
    { name = "SMTP_HOST", param = aws_ssm_parameter.smtp_host },
    { name = "SMTP_PORT", param = aws_ssm_parameter.smtp_port },
    { name = "SMTP_USER", param = aws_ssm_parameter.smtp_user },
    { name = "SMTP_PASS", param = aws_ssm_parameter.smtp_pass },
    { name = "EMAIL_FROM", param = aws_ssm_parameter.email_from },
    { name = "JSM_DOMAIN", param = aws_ssm_parameter.jsm_domain },
    { name = "JSM_EMAIL", param = aws_ssm_parameter.jsm_email },
    { name = "JSM_API_TOKEN", param = aws_ssm_parameter.jsm_api_token },
    { name = "JSM_SERVICEDESK_ID", param = aws_ssm_parameter.jsm_servicedesk_id },
    { name = "JSM_REQUEST_TYPE_ID", param = aws_ssm_parameter.jsm_request_type_id },
    { name = "PUBLIC_TRAFFIC_WEBHOOK_URL", param = aws_ssm_parameter.public_traffic_webhook_url },
    { name = "PUBLIC_LEAD_WEBHOOK_URL", param = aws_ssm_parameter.public_lead_webhook_url },
  ]

  api_all_secrets = concat(
    local.api_secrets,
    var.api_secret_environment,
    [for s in local.api_optional_secrets : {
      name      = s.name
      valueFrom = try(s.param[0].arn, "")
    } if try(length(s.param), 0) > 0]
  )

  worker_secrets = [
    { name = "DATABASE_URL", valueFrom = aws_ssm_parameter.database_url.arn },
    { name = "SUPABASE_ANON_KEY", valueFrom = aws_ssm_parameter.supabase_anon_key.arn },
    { name = "SQS_QUEUE_URL", valueFrom = aws_ssm_parameter.sqs_queue_url.arn },
  ]

  worker_optional_secrets = [
    { name = "STRIPE_SECRET_KEY", param = aws_ssm_parameter.stripe_secret_key },
    { name = "SENTRY_DSN", param = aws_ssm_parameter.sentry_dsn },
    { name = "SMTP_HOST", param = aws_ssm_parameter.smtp_host },
    { name = "SMTP_PORT", param = aws_ssm_parameter.smtp_port },
    { name = "SMTP_USER", param = aws_ssm_parameter.smtp_user },
    { name = "SMTP_PASS", param = aws_ssm_parameter.smtp_pass },
    { name = "EMAIL_FROM", param = aws_ssm_parameter.email_from },
    { name = "JIRA_BASE_URL", param = aws_ssm_parameter.jira_base_url },
    { name = "JIRA_EMAIL", param = aws_ssm_parameter.jira_email },
    { name = "JIRA_API_TOKEN", param = aws_ssm_parameter.jira_api_token },
    { name = "JSM_BASE_URL", param = aws_ssm_parameter.jsm_base_url },
    { name = "JSM_EMAIL", param = aws_ssm_parameter.jsm_email },
    { name = "JSM_API_TOKEN", param = aws_ssm_parameter.jsm_api_token },
    { name = "M365_TENANT_ID", param = aws_ssm_parameter.m365_tenant_id },
    { name = "M365_CLIENT_ID", param = aws_ssm_parameter.m365_client_id },
    { name = "M365_CLIENT_SECRET", param = aws_ssm_parameter.m365_client_secret },
    { name = "API_BASE_URL", param = aws_ssm_parameter.api_base_url },
  ]

  worker_all_secrets = concat(
    local.worker_secrets,
    var.worker_secret_environment,
    [for s in local.worker_optional_secrets : {
      name      = s.name
      valueFrom = try(s.param[0].arn, "")
    } if try(length(s.param), 0) > 0]
  )

  worker_base_environment = [
    { name = "NODE_ENV", value = "production" },
    { name = "SUPABASE_URL", value = local.supabase_endpoint }
  ]

  api_environment    = concat(local.api_base_environment, var.api_extra_environment)
  worker_environment = concat(local.worker_base_environment, var.worker_extra_environment)

  all_secret_value_from_arns = distinct(compact(concat(
    [for item in local.api_secrets : item.valueFrom],
    [for item in local.worker_secrets : item.valueFrom],
    [for item in var.api_secret_environment : item.valueFrom],
    [for item in var.worker_secret_environment : item.valueFrom],
    [for item in local.api_optional_secrets : try(item.param[0].arn, "") if try(length(item.param), 0) > 0],
    [for item in local.worker_optional_secrets : try(item.param[0].arn, "") if try(length(item.param), 0) > 0]
  )))
}

# Allow ECS execution role to read SSM parameters.
resource "aws_iam_role_policy" "ecs_execution_secrets_access" {
  name = "mainecybertech-ecs-execution-secrets-access"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Effect = "Allow"
          Action = ["ssm:GetParameter", "ssm:GetParameters"]
          Resource = compact([
            aws_ssm_parameter.supabase_url.arn,
            aws_ssm_parameter.supabase_anon_key.arn,
            aws_ssm_parameter.supabase_service_role_key.arn,
            aws_ssm_parameter.jwt_secret.arn,
            aws_ssm_parameter.cors_origin.arn,
            aws_ssm_parameter.database_url.arn,
            aws_ssm_parameter.sqs_queue_url.arn,
          ])
        }
      ],
      length(local.all_secret_value_from_arns) > 0 ? [
        {
          Effect   = "Allow"
          Action   = ["ssm:GetParameter", "secretsmanager:GetSecretValue"]
          Resource = local.all_secret_value_from_arns
        }
      ] : []
    )
  })
}

resource "aws_ecs_task_definition" "api_runtime" {
  family                   = "mainecybertech-api-runtime"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.api_task_cpu
  memory                   = var.api_task_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "api"
      image     = "${aws_ecr_repository.api.repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = var.api_container_port
          hostPort      = var.api_container_port
        }
      ]
      environment = local.api_environment
      secrets     = local.api_all_secrets
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.api.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "api"
        }
      }
    }
  ])
}

resource "aws_ecs_task_definition" "worker_runtime" {
  family                   = "mainecybertech-worker-runtime"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.worker_task_cpu
  memory                   = var.worker_task_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name        = "worker"
      image       = "${aws_ecr_repository.worker.repository_url}:latest"
      essential   = true
      environment = local.worker_environment
      secrets     = local.worker_all_secrets
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.worker.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "worker"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "api" {
  name                              = var.api_service_name
  cluster                           = aws_ecs_cluster.main.id
  task_definition                   = aws_ecs_task_definition.api_runtime.arn
  desired_count                     = var.api_service_desired_count
  launch_type                       = "FARGATE"
  platform_version                  = "LATEST"
  enable_execute_command            = var.enable_execute_command
  health_check_grace_period_seconds = var.api_health_check_grace_period_seconds

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_controller {
    type = "ECS"
  }

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.api_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = var.api_container_port
  }

  depends_on = [aws_lb_listener.api_https]
}

resource "aws_ecs_service" "worker" {
  name                   = var.worker_service_name
  cluster                = aws_ecs_cluster.main.id
  task_definition        = aws_ecs_task_definition.worker_runtime.arn
  desired_count          = var.worker_service_desired_count
  launch_type            = "FARGATE"
  platform_version       = "LATEST"
  enable_execute_command = var.enable_execute_command

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_controller {
    type = "ECS"
  }

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.worker_tasks.id]
    assign_public_ip = false
  }
}

# Service-linked role for ECS autoscaling
resource "aws_iam_service_linked_role" "autoscaling" {
  count            = var.enable_service_autoscaling ? 1 : 0
  aws_service_name = "ecs.application-autoscaling.amazonaws.com"
  description      = "Service-linked role for ECS application autoscaling"
}

# Autoscaling for the API service.
resource "aws_appautoscaling_target" "api" {
  count              = var.enable_service_autoscaling ? 1 : 0
  max_capacity       = var.api_autoscaling_max_capacity
  min_capacity       = var.api_autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
  depends_on = [
    aws_iam_service_linked_role.autoscaling,
    aws_ecs_service.api,
  ]
}

resource "aws_appautoscaling_policy" "api_cpu" {
  count              = var.enable_service_autoscaling ? 1 : 0
  name               = "mainecybertech-api-cpu-target"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.api[0].resource_id
  scalable_dimension = aws_appautoscaling_target.api[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.api[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value = var.api_cpu_target_value
  }
}

# Autoscaling for the worker service.
resource "aws_appautoscaling_target" "worker" {
  count              = var.enable_service_autoscaling ? 1 : 0
  max_capacity       = var.worker_autoscaling_max_capacity
  min_capacity       = var.worker_autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.worker.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
  depends_on         = [aws_iam_service_linked_role.autoscaling]
}

resource "aws_appautoscaling_policy" "worker_cpu" {
  count              = var.enable_service_autoscaling ? 1 : 0
  name               = "mainecybertech-worker-cpu-target"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.worker[0].resource_id
  scalable_dimension = aws_appautoscaling_target.worker[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.worker[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value = var.worker_cpu_target_value
  }
}
