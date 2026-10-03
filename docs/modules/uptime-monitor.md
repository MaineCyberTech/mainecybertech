# Uptime Monitor

**Category:** Infrastructure
**API Routes:** `apps/api/src/routes/uptime-monitor.ts`
**SDK:** `packages/sdk/src/uptime-monitor.ts`

## Overview

Synthetic uptime monitoring service that periodically checks client endpoints and services. Tracks response times, HTTP status codes, SSL certificate validity, and computes uptime percentages over configurable rolling windows. Provides a dashboard summarizing all monitored endpoints with pass/fail/warning status.

## Key Features

- CRUD management of uptime check configurations with target URL, HTTP method, expected status, and check interval
- Configurable check methods: GET, POST, HEAD with optional custom headers
- Check result tracking: HTTP status code, response time (ms), pass/fail, error message, SSL expiration
- Uptime percentage calculation over 7-day, 30-day, and 90-day rolling windows
- Dashboard summary aggregating all checks: total checks, passes today, failures today, warnings, overall health
- SSL certificate expiration monitoring with configurable warning threshold
- Configurable check intervals (60s, 5min, 15min, 30min)
- Pause/resume individual checks without deleting configuration
- Historical result viewing with last 30 results per check
- Search and filter checks by name, URL, or status
- Audit logging on all mutation endpoints
- RLS enforcement: checks scoped to organization_id, results accessible via check_id join

## Endpoints

| Method | Path                               | Description                                                               |
| ------ | ---------------------------------- | ------------------------------------------------------------------------- |
| GET    | /api/v1/uptime-monitor             | List uptime checks (paginated, filterable by status, search by name/URL)  |
| GET    | /api/v1/uptime-monitor/:id         | Get single check configuration                                            |
| POST   | /api/v1/uptime-monitor             | Create new uptime check (URL, method, expected_status, interval)          |
| PATCH  | /api/v1/uptime-monitor/:id         | Update check config (URL, interval, expected status, headers)             |
| DELETE | /api/v1/uptime-monitor/:id         | Remove check and all associated result records                            |
| GET    | /api/v1/uptime-monitor/:id/results | Get last 30 check results ordered by checked_at desc                      |
| GET    | /api/v1/uptime-monitor/:id/uptime  | Uptime percentage for 7/30/90 day windows                                 |
| GET    | /api/v1/uptime-monitor/dashboard   | Summary dashboard: total checks, passes, failures, warnings, health score |

## Data Model

Tables: `uptime_checks` (organization_id, name, url, method, expected_status, check_interval_seconds, headers (jsonb), ssl_check_enabled, is_paused, last_checked_at, last_status, created_by), `uptime_results` (check_id, status_code, response_time_ms, is_up, error_message, ssl_valid_until, ssl_days_remaining, checked_at)

## Access Control

- Admin: full CRUD on checks, view results/uptime stats/dashboard
- Client: view-only on uptime dashboard with pass/fail status per check (portal)
