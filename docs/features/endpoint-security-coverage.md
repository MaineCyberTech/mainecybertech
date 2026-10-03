# Endpoint Security Coverage

## Purpose

Monitor endpoint protection posture across device groups: antivirus coverage, full-disk encryption, MDM enrollment, local admin removal, firewall state, and EDR deployment. The module surfaces an aggregate coverage percentage per group and an org-wide coverage summary so gaps can be triaged.

Primary users: MSP security analyst, client sponsor, technician

Business impact: High

Category: security_suite

## Permissions

| Action                | Roles                         |
| --------------------- | ----------------------------- |
| List endpoint groups  | All authenticated org members |
| View endpoint group   | All authenticated org members |
| Create endpoint group | admin, super_admin            |
| Update endpoint group | admin, super_admin            |
| Delete endpoint group | admin, super_admin            |
| View coverage summary | All authenticated org members |

## Routes

### Portal Routes

| Route                           | Description                                   |
| ------------------------------- | --------------------------------------------- |
| `GET /portal/endpoint-security` | List endpoint security groups with coverage % |

### API Routes

| Method | Endpoint                                            | Description                                  |
| ------ | --------------------------------------------------- | -------------------------------------------- |
| GET    | `/api/v1/security-suite/endpoint-security`          | List endpoint groups (paginated, filterable) |
| GET    | `/api/v1/security-suite/endpoint-security/:id`      | Get single endpoint group                    |
| POST   | `/api/v1/security-suite/endpoint-security`          | Create endpoint group                        |
| PATCH  | `/api/v1/security-suite/endpoint-security/:id`      | Update endpoint group                        |
| DELETE | `/api/v1/security-suite/endpoint-security/:id`      | Delete endpoint group                        |
| GET    | `/api/v1/security-suite/endpoint-security/coverage` | Aggregate AV/encryption/MDM coverage summary |

## Data Model

### endpoint_security

| Column              | Type         | Constraints                      | Description                         |
| ------------------- | ------------ | -------------------------------- | ----------------------------------- |
| id                  | uuid         | PK, default gen_random_uuid()    | Unique identifier                   |
| organization_id     | uuid         | FK → organizations(id), NOT NULL | Tenant scoping                      |
| device_group        | text         | NOT NULL                         | Group name (e.g. "Finance")         |
| total_endpoints     | integer      | default 0                        | Endpoints in the group              |
| av_installed        | integer      | default 0                        | Endpoints with AV installed         |
| disk_encrypted      | integer      | default 0                        | Endpoints with full-disk encryption |
| mdm_enrolled        | integer      | default 0                        | Endpoints enrolled in MDM           |
| local_admin_removed | integer      | default 0                        | Endpoints with local admin removed  |
| firewall_enabled    | integer      | default 0                        | Endpoints with firewall enabled     |
| edr_deployed        | integer      | default 0                        | Endpoints with EDR agent deployed   |
| coverage_pct        | numeric(5,2) |                                  | Overall coverage percentage         |
| status              | text         | NOT NULL, default 'active'       | Group status                        |
| notes               | text         |                                  | Analyst notes                       |
| created_by          | uuid         | FK → auth.users(id)              | Creator                             |
| created_at          | timestamptz  | NOT NULL, default now()          | Creation timestamp                  |
| updated_at          | timestamptz  | NOT NULL, default now()          | Last update timestamp               |

## Workflows

### Group Coverage Rollup

- Each row represents one device group
- `coverage_pct` is maintained per group (AV + encryption + MDM normalized)
- The portal renders each group card with a coverage progress bar

### Org-Wide Coverage Summary

- `GET /api/v1/security-suite/endpoint-security/coverage` aggregates all groups for the org
- Computes `avCoverage`, `encryptionCoverage`, `mdmCoverage` as percentages of `total_endpoints`
- Returns `overallCoverage` = average of the three sub-coverage values
- Used by dashboards and reporting to identify under-covered groups

### Remediation

1. Analyst identifies group with low `coverage_pct`
2. Updates group counts as endpoints are remediated (AV install, encryption, MDM enrollment)
3. `status` moves to `active` once counts reflect the target posture
4. Notes capture remediation history

## AI Review Rules

- AI may draft remediation notes, coverage gap summaries, and per-group action lists
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying to actual endpoint security records
- Store `prompt_key`, `prompt_version`, and `reviewer_status` for traceability

## Troubleshooting

| Issue                    | Resolution                                                      |
| ------------------------ | --------------------------------------------------------------- |
| Coverage summary is 0%   | Verify endpoint groups exist and `total_endpoints` is populated |
| Group card missing       | Verify org has rows in `endpoint_security`; check RLS policies  |
| RLS policy denies access | Confirm user has an approved membership in the organization     |
| Coverage percent > 100   | Ensure sub-counts never exceed `total_endpoints` for a group    |
| 404 on group by id       | Confirm `organization_id` query param matches the group's org   |

## Release Checklist

- [ ] Migration `5302070_security_suite.sql` applied
- [ ] API routes registered in `apps/api/src/routes/security-suite.ts`
- [ ] Validator `createEndpointSchema` in `apps/api/src/validators/security-suite.ts`
- [ ] SDK module `securitySuite.endpoints` exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/endpoint-security/`
- [ ] Unit tests pass: `pnpm --filter=api test security-suite`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/endpoint-security.spec.ts`
- [ ] Feature doc added to `docs/features/endpoint-security-coverage.md`
- [ ] Runbook added to `docs/runbooks/endpoint-security-coverage.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
