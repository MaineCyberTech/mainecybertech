# M365 Hardening

## Purpose

Track and score Microsoft 365 tenant security hardening posture for each client organization: MFA enforcement, conditional access, legacy auth blocking, admin/guest counts, audit logging, DLP, and Defender coverage. Each tenant has a record with boolean hardening checks, an `overall_score`, and a `next_review_at` schedule. A `/scan` endpoint marks the latest scan timestamp for recurring assessments.

Primary users: MSP security engineer, client admin, technician

Business impact: High

Category: security

## Permissions

Permission module key: `m365-hardening` (view / create / edit / delete)

| Action                  | Roles                          |
| ----------------------- | ------------------------------ |
| List/view hardening     | All authenticated org members  |
| Create hardening record | admin, super_admin, technician |
| Update hardening record | admin, super_admin, technician |
| Delete hardening record | admin, super_admin             |
| Trigger scan            | admin, super_admin             |

## Routes

### Portal Routes

| Route                        | Description                              |
| ---------------------------- | ---------------------------------------- |
| `GET /portal/m365-hardening` | List tenant hardening checks for the org |

### Admin Routes

| Route                       | Description                           |
| --------------------------- | ------------------------------------- |
| `GET /admin/m365-hardening` | Admin management of hardening records |

### API Routes

| Method | Endpoint                                         | Description                                    |
| ------ | ------------------------------------------------ | ---------------------------------------------- |
| GET    | `/api/v1/security-suite/m365-hardening`          | List hardening records (paginated, org-scoped) |
| POST   | `/api/v1/security-suite/m365-hardening`          | Create a hardening record                      |
| GET    | `/api/v1/security-suite/m365-hardening/:id`      | Get single hardening record                    |
| PATCH  | `/api/v1/security-suite/m365-hardening/:id`      | Update hardening record                        |
| DELETE | `/api/v1/security-suite/m365-hardening/:id`      | Delete hardening record                        |
| POST   | `/api/v1/security-suite/m365-hardening/:id/scan` | Mark scan complete, schedule next review       |

## Data Model

### m365_hardening

| Column                        | Type        | Constraints                      | Description                            |
| ----------------------------- | ----------- | -------------------------------- | -------------------------------------- |
| id                            | uuid        | PK, default gen_random_uuid()    | Unique identifier                      |
| organization_id               | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                         |
| tenant_domain                 | text        | NOT NULL                         | M365 tenant domain                     |
| mfa_enforced                  | boolean     | default false                    | MFA enforced on tenant                 |
| conditional_access_configured | boolean     | default false                    | Conditional access policies present    |
| legacy_auth_blocked           | boolean     | default false                    | Legacy auth protocols blocked          |
| admin_count                   | integer     | default 0                        | Number of admin accounts               |
| guest_count                   | integer     | default 0                        | Number of guest users                  |
| shared_mailbox_count          | integer     | default 0                        | Shared mailboxes in use                |
| audit_logging_enabled         | boolean     | default false                    | Unified audit log enabled              |
| dlp_configured                | boolean     | default false                    | Data loss prevention configured        |
| defender_configured           | boolean     | default false                    | Microsoft Defender for M365 configured |
| last_assessment_at            | timestamptz |                                  | Most recent assessment time            |
| next_review_at                | timestamptz |                                  | Scheduled next review                  |
| overall_score                 | integer     |                                  | Aggregate hardening score (0-100)      |
| status                        | text        | NOT NULL, default 'needs_review' | needs_review / reviewed / compliant    |
| notes                         | text        |                                  | Assessment notes                       |
| created_by                    | uuid        | FK → auth.users(id)              | Creator                                |
| created_at                    | timestamptz | NOT NULL, default now()          | Creation timestamp                     |
| updated_at                    | timestamptz | NOT NULL, default now()          | Last update timestamp                  |

## Workflows

### Create Hardening Record

1. Engineer records `tenant_domain` plus the boolean hardening checks from an M365 security assessment
2. Set `overall_score` (0-100) and optional `notes`
3. `status` defaults to `needs_review`; updated to `reviewed`/`compliant` as findings close

### Trigger Scan

1. `POST /api/v1/security-suite/m365-hardening/:id/scan` validates the record exists
2. Sets `last_scanned_at` (mapped to `last_assessment_at` semantics) to now
3. Sets `scan_status = completed` and `next_scan_at` to +30 days
4. Returns the updated record with the scan timestamp

### Review Cadence

- `next_review_at` drives recurring assessments (30-day default after scan)
- Portal shows count of hardening checks; overdue tenants flagged for follow-up

## AI Review Rules

- AI may draft remediation guidance and hardening recommendations based on the boolean check set
- Outputs stored in `ai_draft_outputs` with `status = 'draft'`; human review before applying

## Troubleshooting

| Issue                    | Resolution                                                        |
| ------------------------ | ----------------------------------------------------------------- |
| List empty for valid org | Verify `organization_id` matches the active org; check RLS policy |
| 404 on known ID          | Confirm record belongs to the active org (org-scoped by-id query) |
| Scan endpoint fails      | Verify the record ID exists; check API logs for DB_ERROR          |
| Score not updating       | Confirm `overall_score` is written on PATCH; no computed default  |

## Release Checklist

- [ ] Migration `5302070_security_suite.sql` applied (m365_hardening table + RLS)
- [ ] Permission keys `m365-hardening:view/create/edit/delete` seeded (5302118)
- [ ] API routes in `apps/api/src/routes/security-suite.ts` (crudRoute + scan)
- [ ] Validators in `apps/api/src/validators/security-suite.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page `apps/web/app/(portal)/portal/m365-hardening/` renders
- [ ] Admin page `apps/web/app/(admin)/admin/m365-hardening/` renders
- [ ] E2E passes: `pnpm e2e --project=chromium apps/web/e2e/portal/m365-hardening.spec.ts`
- [ ] Feature doc: this file
- [ ] Runbook: `docs/runbooks/m365-hardening.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
