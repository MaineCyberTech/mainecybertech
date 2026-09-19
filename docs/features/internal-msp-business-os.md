# Internal MSP Business OS

## Purpose

Private operating dashboard for the MSP platform — client health, open work, approvals, documents, users, and recent audit activity across all tenants. Intentionally admin-only (no portal page): this is internal business intelligence, not client-facing.

Primary users: MSP leadership, operations manager, super admins

Business impact: Very High

Category: operations (internal)

## Permissions

| Action                   | Roles              |
| ------------------------ | ------------------ |
| View Business OS summary | admin, super_admin |
| View overdue approvals   | admin, super_admin |
| View recent activity     | admin, super_admin |
| View org health          | admin, super_admin |

The router uses `requireAuth` + `requireAdmin`; there is no portal route by design.

## Routes

### Portal Routes

None — admin-only dashboard is intentional. Clients never see Business OS.

### Admin Routes

| Route                    | Description                                                    |
| ------------------------ | -------------------------------------------------------------- |
| `GET /admin/business-os` | Business OS Dashboard (summary, overdue, activity, org health) |

### API Routes

| Method | Endpoint                                | Description                                         |
| ------ | --------------------------------------- | --------------------------------------------------- |
| GET    | `/api/v1/business-os/summary`           | Platform summary (cached 30s)                       |
| GET    | `/api/v1/business-os/approvals-overdue` | Pending approvals past due (cached 30s)             |
| GET    | `/api/v1/business-os/recent-activity`   | Recent audit_logs feed (cached 15s)                 |
| GET    | `/api/v1/business-os/org-health`        | Per-org open tickets + active projects (cached 60s) |

## Data Model

No dedicated `business_os_*` table — the endpoints aggregate live data from:

| Table               | Usage                                             |
| ------------------- | ------------------------------------------------- |
| `organizations`     | total/approved/pending counts + recent orgs       |
| `tickets`           | open ticket count (non-resolved/closed/completed) |
| `projects`          | active project count                              |
| `documents`         | total document count                              |
| `approval_requests` | pending count + overdue items                     |
| `profiles`          | total user count                                  |
| `audit_logs`        | recent-activity feed                              |

## Workflows

### Summary

- Six parallel aggregate queries (orgs, open tickets, active projects, documents, pending approvals, users) run and are cached 30s
- `/summary` returns org breakdown (total/approved/pending + recent 5) and per-module counters

### Overdue Approvals

- Pending `approval_requests` with `due_at < now()`, ordered by due date, limited to 20
- `/admin/business-os` renders an "Overdue Approvals" panel linking to `/admin/approvals`

### Organization Health

- Approved orgs are scored by open-ticket and active-project counts, sorted by most open tickets
- Renders the "Organization Health" section linking to each org's admin page

### Worker Snapshot

- Worker task `business-os-snapshot` can persist periodic snapshots for trend analysis

## AI Review Rules

- AI may draft executive summaries from Business OS aggregates
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before distribution

## Troubleshooting

| Issue                | Resolution                                                                          |
| -------------------- | ----------------------------------------------------------------------------------- |
| Dashboard all zeros  | Confirm API reachable; summary degrades gracefully on failure                       |
| Activity feed empty  | Verify audit_logs has events; recent-activity cache 15s                             |
| 403 on load          | Requires admin/super_admin role membership                                          |
| Cached stale numbers | Wait out the TTL (30s summary / 60s org-health) or rely on cache no-renew semantics |

## Release Checklist

- [ ] API routes registered in `apps/api/src/app.ts` (mounted at `/api/v1/business-os`)
- [ ] SDK methods exported from `packages/sdk/src/index.ts` (`dashboard.businessOsSummary`, `approvalsOverdue`, `recentActivity`, `orgHealth`)
- [ ] Admin page created in `apps/web/app/(admin)/admin/business-os/`
- [ ] Worker task `business-os-snapshot` registered
- [ ] Unit tests pass: `pnpm --filter=api test business-os`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/admin/business-os.spec.ts`
- [ ] Feature doc added to `docs/features/internal-msp-business-os.md`
- [ ] Runbook added to `docs/runbooks/internal-msp-business-os.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
