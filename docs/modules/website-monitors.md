# Website Monitors

**Category:** Operations
**API Routes:** `apps/api/src/routes/batch.ts` (batch-accessible)
**SDK:** `packages/sdk/src/website-monitors.ts`

## Overview
Website uptime, SSL certificate, and Lighthouse performance monitoring for tracking client website availability, security, and performance scores.

## Key Features
- Periodic uptime checks with response time tracking
- SSL certificate validity monitoring
- Lighthouse performance scoring (performance, accessibility, SEO)
- Status dashboard for monitored sites
- Scheduled check history

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/batch/website-monitors | List website monitors (via batch API) |

## Data Model
Key fields: `url`, `display_name`, `status`, `response_time_ms`, `ssl_valid`, `lighthouse_score`, `last_checked_at`, `organization_id`, `created_by`

## Access Control
- Admin: full management via admin UI
- Client: read-only (portal, own org sites)

## Worker Tasks
- `website-monitor-check`: Periodic uptime, SSL, and Lighthouse verification
