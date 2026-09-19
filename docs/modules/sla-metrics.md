# SLA Metrics

**Category:** Operations
**API Routes:** `apps/api/src/routes/sla-metrics.ts`

## Overview

Service Level Agreement tracking and metrics reporting. Provides breach rates, per-metric breakdowns, and recent SLA log entries over a configurable day window. Results cached for 60 seconds.

## Key Features

- Configurable reporting window (1-90 days)
- Cached for 60 seconds to reduce database load
- Breach rate calculations per SLA metric
- Per-metric breakdowns (response time, resolution time)
- Recent SLA log entries with details
- Organization-scoped metrics

## Endpoints

| Method | Path                        | Description                                       |
| ------ | --------------------------- | ------------------------------------------------- |
| GET    | /api/v1/sla-metrics/metrics | Get SLA metrics (cached 60s, configurable window) |

## Data Model

Key fields: `id`, `ticket_id`, `organization_id`, `metric_type`, `target_minutes`, `actual_minutes`, `breached`, `breached_at`, `created_at`

## Access Control

- Admin: full access to SLA metrics across all organizations
- Client: no access
