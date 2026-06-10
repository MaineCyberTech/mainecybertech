#############################################
# Foundational compute resources
#
# This file preserves the core compute primitives from the
# original walkthrough while moving the final task definitions
# into runtime.tf for a single hardened operational model.
#############################################

# Dead-letter queue for failed job processing
resource "aws_sqs_queue" "jobs_dlq" {
  name                        = "mainecybertech-jobs-dlq.fifo"
  fifo_queue                  = true
  content_based_deduplication = true

  tags = {
    Name        = "mainecybertech-jobs-dlq"
    Environment = var.environment
  }
}

# Primary jobs queue with visibility timeout and redrive policy
resource "aws_sqs_queue" "jobs_queue" {
  name                        = "mainecybertech-jobs.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  visibility_timeout_seconds  = 60  # Visibility timeout must be >= max task runtime + buffer

  # Redrive policy: messages with 3+ failures go to DLQ
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.jobs_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Name        = "mainecybertech-jobs"
    Environment = var.environment
  }
}

# CloudWatch Alarms for job queue monitoring
resource "aws_cloudwatch_metric_alarm" "jobs_dlq_depth" {
  alarm_name          = "mainecybertech-jobs-dlq-depth"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "Alert when messages appear in DLQ (failed job processing)"
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.jobs_dlq.name
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "jobs_queue_depth" {
  alarm_name          = "mainecybertech-jobs-queue-depth"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 10
  alarm_description   = "Alert when job queue depth exceeds 10 messages"
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.jobs_queue.name
  }

  tags = {
    Environment = var.environment
  }
}

# Request ACM certificate for API domain
resource "aws_acm_certificate" "api" {
  domain_name       = var.api_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "mainecybertech-api-cert"
    Environment = var.environment
  }
}

# API ECR Repository
resource "aws_ecr_repository" "api" {
  name                 = "mainecybertech-api"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "mainecybertech-api"
    Environment = var.environment
  }
}

# Worker ECR Repository
resource "aws_ecr_repository" "worker" {
  name                 = "mainecybertech-worker"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = {
    Name        = "mainecybertech-worker"
    Environment = var.environment
  }
}
