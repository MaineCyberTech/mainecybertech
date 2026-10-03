# Website Uptime Monitor

## Purpose

Continuously monitor website availability and SSL health. Each check tracks a URL, check interval, expected status code, and timeout; results record response status, response time, SSL expiry, and up/down state, with 7/30/90-day uptime percentages and a live dashboard summary.

Primary users: MSP NOC, client admin

Business impact: High

Category: operations

## Permissions

| Action              | Roles                         |
| ------------------- | ----------------------------- |
| List checks         | All authenticated org members |
| View check details  | All authenticated org members |
| View results/uptime | All authenticated org members |
| Create check        | All authenticated org members |
| Update check        | All authenticated org members |
| Delete check        | admin, super_admin            |
| View dashboard      | All authenticated org members |

## Routes

### Portal Routes

| Route                        | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `GET /portal/uptime-monitor` | Uptime checks + status badges for organization |

### Admin Routes

| Route                       | Description                    |
| --------------------------- | ------------------------------ |
| `GET /admin/uptime-monitor` | Uptime Monitor page (Monitors) |

### API Routes

| Method | Endpoint                                    | Description                              |
| ------ | ------------------------------------------- | ---------------------------------------- |
| GET    | `/api/v1/uptime-monitor/dashboard`          | Checks with last result + uptime summary |
| GET    | `/api/v1/uptime-monitor/checks`             | List checks (paginated)                  |
| GET    | `/api/v1/uptime-monitor/checks/:id`         | Get a single check                       |
| POST   | `/api/v1/uptime-monitor/checks`             | Create a check                           |
| PATCH  | `/api/v1/uptime-monitor/checks/:id`         | Update a check                           |
| DELETE | `/api/v1/uptime-monitor/checks/:id`         | Delete a check                           |
| GET    | `/api/v1/uptime-monitor/checks/:id/results` | Last 30 result samples                   |
| GET    | `/api/v1/uptime-monitor/checks/:id/uptime`  | 7d / 30d / 90d uptime percentages        |

## Data Model

### uptime_checks

| Column                 | Type        | Constraints                      | Description           |
| ---------------------- | ----------- | -------------------------------- | --------------------- |
| id                     | uuid        | PK, default gen_random_uuid()    | Unique identifier     |
| organization_id        | uuid        | FK → organizations(id), NOT NULL | Tenant scoping        |
| url                    | text        | NOT NULL                         | Monitored URL         |
| check_type             | text        | default 'http'                   | http / https / tcp    |
| check_interval_minutes | integer     | default 60                       | How often to check    |
| expected_status_code   | integer     | default 200                      | Expected HTTP status  |
| timeout_seconds        | integer     | default 10                       | Request timeout       |
| status                 | text        | default 'active'                 | active / paused       |
| created_by             | uuid        | FK → auth.users(id)              | Who created the check |
| created_at             | timestamptz | default now()                    | Creation timestamp    |
| updated_at             | timestamptz | default now()                    | Last update timestamp |

### uptime_results

| Column             | Type        | Constraints                      | Description            |
| ------------------ | ----------- | -------------------------------- | ---------------------- |
| id                 | uuid        | PK, default gen_random_uuid()    | Unique identifier      |
| check_id           | uuid        | FK → uptime_checks(id), NOT NULL | Parent check           |
| response_status    | integer     |                                  | HTTP status returned   |
| response_time_ms   | integer     |                                  | Response latency       |
| ssl_expiry_date    | date        |                                  | SSL certificate expiry |
| ssl_days_remaining | integer     |                                  | Days until SSL expiry  |
| is_up              | boolean     | NOT NULL, default false          | Availability flag      |
| error_message      | text        |                                  | Error on failure       |
| checked_at         | timestamptz | default now()                    | When the check ran     |

## Workflows

### Monitor Lifecycle

1. Create a check for a URL with interval, expected status code, and timeout
2. Worker runs checks on schedule and writes `uptime_results` rows
3. The portal renders URL, check type, and a status badge (up green, degraded amber, down red)
4. `GET /dashboard` joins the latest result and computes per-check uptime percentage plus a summary (total/up/down/paused, overall uptime)

### Reporting

- `GET /checks/:id/uptime` computes 7d, 30d, and 90d uptime percentages from result history
- `GET /checks/:id/results` returns the last 30 samples for charting

## Troubleshooting

| Issue                     | Resolution                                         |
| ------------------------- | -------------------------------------------------- |
| Check always shows down   | Verify URL reachable from the worker's network     |
| No results for a check    | Worker task for the check has not run yet          |
| Uptime percentage is 100  | Only one result or no down results recorded so far |
| Delete check denied (403) | Membership role must be `admin` or `super_admin`   |

## Release Checklist

- [ ] Migration `5302093_uptime_monitor.sql` applied
- [ ] API routes registered at `/api/v1/uptime-monitor` in `apps/api/src/app.ts`
- [ ] SDK module `uptimeMonitor` exported from `packages/sdk/src/index.ts`
- [ ] Portal page at `apps/web/app/(portal)/portal/uptime-monitor/`
- [ ] E2E tests pass: `pnpm e2e apps/web/e2e/portal/uptime-monitor.spec.ts`
- [ ] Feature doc added to `docs/features/website-uptime-monitor.md`
- [ ] Runbook added to `docs/runbooks/website-uptime-monitor.md`
