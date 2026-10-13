# Service Level Objectives (SLOs) and Dashboards

**Owner:** Platform/Engineering lead · **Last reviewed:** 2026-10-12 · **Review cadence:** quarterly

This document defines what "healthy" means for the MCT platform, so alert
thresholds and capacity decisions are not ad hoc (`OBS-P2-002`). Metrics come
from `apps/api/src/lib/metrics.ts` (API) and `apps/worker/src/metrics.ts`
(worker), and are scraped by Prometheus (`infra/digitalocean/prometheus.yml`).

## Objectives

| # | SLO | Target (30-day window) | PromQL | Alert |
| - | --- | ---------------------- | ------ | ----- |
| 1 | API availability (non-5xx share) | ≥ 99.9% | `sum(rate(portal_http_requests_total{status_code!~"5.."}[30d])) / clamp_min(sum(rate(portal_http_requests_total[30d])), 0.0001)` | `MCTHighRequestErrorRate` (>5% for 5m is the fast-burn page) |
| 2 | API latency p95 | < 500 ms | `histogram_quantile(0.95, sum by (le) (rate(portal_http_request_duration_seconds_bucket[5m])))` | (dashboard; page at p95 > 2s for 10m) |
| 3 | Webhook delivery success | ≥ 99% | `sum(rate(portal_webhook_deliveries_total{status="success"}[30d])) / clamp_min(sum(rate(portal_webhook_deliveries_total[30d])), 0.0001)` | webhook backlog runbook |
| 4 | Notification delivery success (worker terminal outcomes, per channel) | ≥ 99% | `sum by (channel) (rate(worker_notification_delivery_total{status="success"}[30d])) / clamp_min(sum by (channel) (rate(worker_notification_delivery_total{status=~"success\|failed"}[30d])), 0.0001)` | `MCTNotificationDeliveryFailureRateHigh` (>5% for 30m is the fast-burn page) |
| 5 | RLS-enforced share (rollout signal) | trend up | `sum(rate(portal_rls_enforced_total[30d])) / clamp_min(sum(rate(portal_rls_enforced_total[30d])) + sum(rate(portal_rls_bypass_total[30d])), 0.0001)` | `MCTRlsEnforcedShareCollapsed` |
| 6 | Worker task success (per task type) | ≥ 99% | `sum by (task_type) (rate(worker_task_executions_total{status="success"}[30d])) / clamp_min(sum by (task_type) (rate(worker_task_executions_total[30d])), 0.0001)` | `MCTWorkerTaskFailures` (any failure/error/timeout/no_handler for 10m is the fast-burn page); dead letters → `MCTWorkerTaskDeadLettered` |

> Notification SLO semantics (NOTIF-P2-010): the API records a successful email
> enqueue as `portal_notification_delivery_total{status="queued"}` — a hand-off,
> not a delivery — so objective 4 counts only the worker's terminal outcomes
> (`worker_notification_delivery_total`). `skipped` outcomes (SMTP not
> configured / channel disabled / a push subscription the push service reported
> as gone) are excluded from the ratio and are covered by
> `MCTNotificationEmailSkipped` (email) and
> `worker_push_subscriptions_revoked_total` (push) instead.

> Worker metrics (OBS-P3-007): the worker exports task outcomes
> (`worker_task_executions_total` by `task_type`/`status` and
> `worker_task_execution_duration_seconds`) and queue state
> (`worker_task_queue_depth`, `worker_queue_connected`, `worker_registered_tasks`)
> — see `apps/worker/src/metrics.ts`. Queue saturation is alerted by
> `MCTWorkerQueueBacklog` / `MCTWorkerQueueBacklogGrowing`, a lost consumer by
> `MCTWorkerQueueDisconnected`, and permanently dropped jobs by
> `MCTWorkerTaskDeadLettered` (`infra/digitalocean/prometheus.rules.yml`).

## Error budget policy

- 99.9% availability over 30 days ≈ **43 minutes** of budget.
- When < 25% of the monthly budget remains, freeze non-essential releases and
  prioritise reliability work (see [`PLATFORM_FAILURE_RUNBOOKS.md`](PLATFORM_FAILURE_RUNBOOKS.md)).
- Fast-burn page: 5xx rate > 5% for 5 minutes (`MCTHighRequestErrorRate`).
- Slow-burn ticket: 5xx rate > 1% for 1 hour.

## Dashboards as code

- `infra/digitalocean/dashboards/mct-overview.json` — Grafana-importable
  dashboard for the objectives above (availability, latency, error rate,
  webhook/notification success, RLS-enforced share, active tenants/users).
- The current stack ships Prometheus + Alertmanager only. To render the
  dashboard, add a Grafana service to `infra/digitalocean/docker-compose.yml`
  and provision this JSON (or paste it into an existing Grafana). Until then the
  same PromQL can be queried directly in the Prometheus UI.
