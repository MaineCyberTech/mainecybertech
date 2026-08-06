# DNS Domain Cloudflare Health Monitor

## Purpose

Continuous DNS/domain health monitoring for client domains, including SSL certificate validity/expiry, SPF, DKIM, DMARC posture, nameserver consistency, and Cloudflare proxy state. Surfaces monitoring alerts for domains at risk.

Primary users: MSP security engineer, client IT contact, NOC technician

Business impact: Very High

Category: security

## Permissions

| Action                 | Roles                         |
| ---------------------- | ----------------------------- |
| List domain monitors   | All authenticated org members |
| View domain monitor    | All authenticated org members |
| Create domain monitor  | admin, super_admin            |
| Update domain monitor  | admin, super_admin            |
| Delete domain monitor  | admin, super_admin            |
| Export domain monitors | admin, super_admin            |

## Routes

### Portal Routes

| Route                         | Description                              |
| ----------------------------- | ---------------------------------------- |
| `GET /portal/domain-monitors` | List monitored domains and health badges |

### Admin Routes

| Route                        | Description                         |
| ---------------------------- | ----------------------------------- |
| `GET /admin/domain-monitors` | Monitor list, stats, and management |

### API Routes

| Method | Endpoint                         | Description                                            |
| ------ | -------------------------------- | ------------------------------------------------------ |
| GET    | `/api/v1/domain-monitors`        | List monitors (paginated, filter by status/search/ssl) |
| GET    | `/api/v1/domain-monitors/export` | CSV/JSON export                                        |
| GET    | `/api/v1/domain-monitors/stats`  | Aggregate SSL/SPF/DKIM/DMARC/nameserver counts         |
| GET    | `/api/v1/domain-monitors/:id`    | Get monitor with recent scheduled checks               |
| POST   | `/api/v1/domain-monitors`        | Create monitor                                         |
| PATCH  | `/api/v1/domain-monitors/:id`    | Update monitor (optimistic locking)                    |
| DELETE | `/api/v1/domain-monitors/:id`    | Delete monitor                                         |

## Data Model

### domain_monitors

| Column               | Type        | Constraints                      | Description                         |
| -------------------- | ----------- | -------------------------------- | ----------------------------------- |
| id                   | uuid        | PK, default gen_random_uuid()    | Unique identifier                   |
| organization_id      | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                      |
| domain               | text        | NOT NULL                         | FQDN monitored                      |
| display_name         | text        |                                  | Friendly label                      |
| zone_id              | text        |                                  | Cloudflare zone id (if managed)     |
| nameservers          | jsonb       | default '[]'                     | Detected nameservers                |
| ssl_expires          | date        |                                  | SSL certificate expiry              |
| ssl_issuer           | text        |                                  | SSL issuer                          |
| ssl_valid            | boolean     | default true                     | SSL validation state                |
| spf_status           | text        | default 'unknown'                | valid / invalid / missing / unknown |
| dkim_status          | text        | default 'unknown'                | valid / invalid / missing / unknown |
| dmarc_status         | text        | default 'unknown'                | valid / invalid / missing / unknown |
| dmarc_policy         | text        |                                  | p=none / p=quarantine / p=reject    |
| dns_provider         | text        | default 'cloudflare'             | Hosting DNS provider                |
| cloudflare_proxied   | boolean     | default true                     | Whether domain is proxied via CF    |
| nameserver_mismatch  | boolean     | default false                    | NS records differ from provider     |
| last_checked_at      | timestamptz |                                  | Last check timestamp                |
| next_check_at        | timestamptz |                                  | Next scheduled check                |
| check_interval_hours | integer     | default 24                       | Check frequency                     |
| alerts_enabled       | boolean     | default true                     | Alert toggle                        |
| owner_user_id        | uuid        | FK → auth.users(id)              | Responsible user                    |
| status               | text        | NOT NULL, default 'active'       | active / warning / error / inactive |
| visibility           | text        | NOT NULL, default 'internal'     | internal / client                   |
| created_by           | uuid        | FK → auth.users(id)              | Creator                             |
| metadata             | jsonb       | NOT NULL, default '{}'           | Flexible metadata                   |
| created_at           | timestamptz | NOT NULL, default now()          | Creation timestamp                  |
| updated_at           | timestamptz | NOT NULL, default now()          | Last update timestamp               |

Scheduled check results are stored in `scheduled_check_results` with `module_key = 'domain-monitors'` and `check_target` = the domain.

## Workflows

### Scheduled Check

- Worker task `domain-monitor-check` runs periodically
- Checks SSL validity/expiry, SPF/DKIM/DMARC records, nameserver consistency, and Cloudflare proxy state
- Writes results to `scheduled_check_results` and updates monitor fields + status (warning/error)
- Stats endpoint aggregates SSL invalid/expiring (≤30 days), SPF/DKIM/DMARC missing/invalid, NS mismatch, and not-proxied counts

### Alerting

- `alerts_enabled` gates notifications on degraded monitor state
- QBR report generation consumes `domain_monitors` to compute `securityPosture.monitoredDomains` and `alertCount`

## AI Review Rules

- AI may draft remediation guidance from DNS/DMARC findings
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying changes

## Troubleshooting

| Issue                       | Resolution                                                            |
| --------------------------- | --------------------------------------------------------------------- |
| Monitor status stuck        | Verify worker task `domain-monitor-check` is scheduled and succeeding |
| SSL/SPF values stale        | Check `last_checked_at` vs `next_check_at`                            |
| Stats endpoint wrong counts | Confirm filters use real columns (`ssl_valid`, `spf_status`, etc.)    |
| 404 on detail               | Ensure `organizationId` matches; admin delete removes monitor         |

## Release Checklist

- [ ] Migration `5302062_domain_monitor.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] Validators created in `apps/api/src/validators/domain-monitors.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/domain-monitors/`
- [ ] Worker task `domain-monitor-check` registered
- [ ] Unit tests pass: `pnpm --filter=api test domain-monitors`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/domain-monitors.spec.ts`
- [ ] Feature doc added to `docs/features/dns-domain-cloudflare-health-monitor.md`
- [ ] Runbook added to `docs/runbooks/dns-domain-cloudflare-health-monitor.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
