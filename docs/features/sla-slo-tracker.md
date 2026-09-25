# SLA/SLO Tracker

## Purpose

Track service level agreements (SLA) and service level objectives (SLO) for ticket response, resolution, and triage. Aggregates SLA logs into summary metrics (total, breached, breach rate, resolved) and a per-metric breakdown of average minutes.

Primary users: service desk manager, client admin, technician

Business impact: High

Category: operations

## Permissions

| Action           | Roles                         |
| ---------------- | ----------------------------- |
| View SLA metrics | All authenticated org members |
| Insert SLA logs  | admin, super_admin            |

## Routes

### Portal Routes

| Route             | Description                                    |
| ----------------- | ---------------------------------------------- |
| `GET /portal/sla` | SLA summary and per-metric breakdown dashboard |

### API Routes

| Method | Endpoint              | Description                                                 |
| ------ | --------------------- | ----------------------------------------------------------- |
| GET    | `/api/v1/sla/metrics` | SLA summary + by-metric breakdown (last N days, default 30) |

## Data Model

### sla_logs

| Column          | Type        | Constraints                                                 | Description              |
| --------------- | ----------- | ----------------------------------------------------------- | ------------------------ |
| id              | uuid        | PK, default gen_random_uuid()                               | Unique identifier        |
| organization_id | uuid        | FK → organizations(id), NOT NULL                            | Tenant scoping           |
| ticket_id       | uuid        | FK → tickets(id)                                            | Related ticket           |
| metric          | text        | NOT NULL, check in ('first_response','resolution','triage') | SLA metric               |
| target_minutes  | int         | NOT NULL, default 60                                        | SLA target               |
| actual_minutes  | int         |                                                             | Actual elapsed minutes   |
| breached        | boolean     | NOT NULL, default false                                     | Whether SLA was breached |
| breached_at     | timestamptz |                                                             | Breach timestamp         |
| resolved_at     | timestamptz |                                                             | Resolution timestamp     |
| created_at      | timestamptz | NOT NULL, default now()                                     | Creation timestamp       |

## Workflows

### Log SLA Events

1. Tickets generate SLA logs for `first_response`, `resolution`, and `triage` metrics
2. `sla_logs` rows record the target, actual minutes, and breach flag
3. The `calculate_sla_breach()` function can compute breach status from elapsed time

### Metrics Dashboard

- `GET /api/v1/sla/metrics?organization_id=<id>&days=30` returns a summary of total, breached, breach rate, and resolved, plus a per-metric breakdown of total/breached/average minutes

## AI Review Rules

- AI may draft SLA breach summaries and remediation recommendations
- All AI outputs are stored for human review
- Breach calculations are deterministic database logic

## Troubleshooting

| Issue                     | Resolution                                                          |
| ------------------------- | ------------------------------------------------------------------- |
| Empty metrics             | No SLA logs in the selected window for the org                      |
| Breach rate is 0%         | No logs flagged as breached; verify `breached` flags                |
| By Metric section missing | No SLA logs exist; the breakdown only renders with data             |
| Slow dashboard            | Check the `idx_sla_logs_org` index on (organization_id, created_at) |
| RLS policy denies access  | Confirm user has membership in the organization                     |

## Release Checklist

- [ ] Migration `5302041_sla_logs.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/sla/`
- [ ] Unit tests pass: `pnpm --filter=api test sla`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/sla.spec.ts`
- [ ] Feature doc added to `docs/features/sla-slo-tracker.md`
- [ ] Runbook added to `docs/runbooks/sla-slo-tracker.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
