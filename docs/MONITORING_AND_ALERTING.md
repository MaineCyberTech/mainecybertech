# Monitoring & Alerting Strategy

## Overview

MCT uses a layered monitoring approach: application logs, infrastructure metrics, and synthetic checks.

## Application Monitoring

### API (`apps/api`)

**Logging:** Structured JSON via pino (production) / pretty-printed (development)

Every request logs:
- `requestId` — UUID4 from `X-Request-ID` header
- `method`, `path`, `status`, `duration` (ms)
- `userAgent`, `ip`

Every error logs:
- `requestId`, `method`, `path`
- Error type, code, message, stack

**Recommended CloudWatch metric filters:**

| Filter Pattern | Metric Name | Purpose |
|---|---|---|
| `?ERROR ?WARN` | `ApiErrors` | Count of error-level log entries |
| `"status":500` | `Api5xxCount` | 5xx error spikes |
| `"status":429` | `ApiRateLimitHits` | Rate limit triggers |
| `"duration" > 5000` | `ApiSlowRequests` | Slow request detection |

### Worker (`apps/worker`)

**Logging:** Same pino structured JSON

Every task logs:
- `type`, `messageId`, `duration`
- Success/failure status

**Recommended metric filters:**

| Filter Pattern | Metric Name | Purpose |
|---|---|---|
| `"Task failed"` | `WorkerTaskFailures` | Failed task count |
| `"Task handler threw"` | `WorkerTaskErrors` | Unhandled task errors |
| `"Error polling SQS"` | `WorkerSQSErrors` | SQS connectivity issues |

### Web (`apps/web`)

**Next.js:** Standard server-side logging via pino

**Recommended checks:**
- `/api/health` endpoint (already exists)
- Synthetic Playwright E2E on schedule (optional, for uptime monitoring)

## Infrastructure Monitoring

### ECS

| Metric | Threshold | Action |
|---|---|---|
| `CPUUtilization` | > 80% for 5 min | Warning alert |
| `CPUUtilization` | > 95% for 5 min | Critical alert |
| `MemoryUtilization` | > 85% for 5 min | Warning alert |
| `RunningTaskCount` | < desired for 5 min | Critical (service degraded) |
| `DeploymentCircuitBreaker` | > 0 | Critical (auto-rollback) |

### ALB

| Metric | Threshold | Action |
|---|---|---|
| `TargetResponseTime` | p95 > 5s for 5 min | Warning |
| `HTTPCode_5XX_Count` | > 10 in 5 min | Critical |
| `HTTPCode_4XX_Count` | > 50 in 5 min | Warning |
| `ActiveConnectionCount` | > 1000 | Warning (capacity) |

### SQS

| Metric | Threshold | Action |
|---|---|---|
| `ApproximateAgeOfOldestMessage` | > 300s | Warning (backlog) |
| `ApproximateAgeOfOldestMessage` | > 3600s | Critical |
| `NumberOfMessagesSent` | 0 for 1 hour | Warning (no new jobs) |
| `ApproximateNumberOfMessagesVisible` | > 1000 | Warning |

### Supabase

- **Dashboard:** Use Supabase built-in monitoring
- **Key alerts:**
  - Connection pool exhaustion
  - Storage quota > 80%
  - Project paused (payment failure)

## Alerting Setup

### AWS CloudWatch Alarms

Create alarms for the critical metrics above using Terraform or AWS console:

```hcl
resource "aws_cloudwatch_metric_alarm" "api_cpu" {
  alarm_name          = "mct-api-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "API CPU > 80% for 5 minutes"
}
```

### Notification Channels

| Channel | Use For |
|---|---|
| Slack | Real-time alerts, deployment notifications |
| Email | Critical alerts, weekly summaries |
| PagerDuty/Opsgenie | Production outages, circuit breaker trips |

## Uptime Monitoring

### Recommended Tools

| Tool | Purpose | Frequency |
|---|---|---|
| BetterUptime / UptimeRobot | HTTP health checks | Every 60s |
| Checkly | Synthetic E2E monitoring | Every 5 min |
| Sentry | Error tracking & alerting | Real-time |

### Health Check Endpoints

| Endpoint | Service | Expected Response |
|---|---|---|
| `GET /health` | API | 200 `{"status":"ok"}` |
| Vercel `/` | Web | 200 |
| `GET /health` | Worker | 200 (when implemented) |

## Dashboards

### Recommended CloudWatch Dashboard Panels

1. **API Health:** Request rate, p50/p95/p99 latency, error rate
2. **ECS Resources:** CPU/memory utilization, task count, deployment history
3. **SQS Depth:** Message count, age, processing rate
4. **Supabase:** Query count, connection count, storage usage

## Incident Response

1. **Alert fires** → Check CloudWatch dashboard
2. **Identify scope** → Which service? How many users affected?
3. **Check recent deployments** → Was there a deploy in the last 30 min?
4. **Check logs** → Use CloudWatch Logs Insights with `requestId` for correlation
5. **Rollback if needed** → Use `docs/ROLLBACK_PROCEDURES.md`
6. **Post-incident** → Update runbook if new failure mode discovered
