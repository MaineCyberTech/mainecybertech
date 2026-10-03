# DNS Change Request Approvals

## Purpose

Manage DNS change requests for the organization: track requested domain changes (record type, proposed and current values), route them through approve / reject / implement workflow states, and keep an audit trail of who approved and when.

Primary users: MSP network engineer, client sponsor, technician

Business impact: High

Category: final

## Permissions

| Action                    | Roles                         |
| ------------------------- | ----------------------------- |
| List DNS change requests  | All authenticated org members |
| View DNS change request   | All authenticated org members |
| Create DNS change request | admin, super_admin            |
| Update DNS change request | admin, super_admin            |
| Delete DNS change request | admin, super_admin            |
| Approve / reject request  | admin, super_admin            |
| Implement request         | admin, super_admin            |

## Routes

### Portal Routes

| Route                     | Description                                   |
| ------------------------- | --------------------------------------------- |
| `GET /portal/dns-changes` | List DNS change requests with workflow status |

### API Routes

| Method | Endpoint                                  | Description                             |
| ------ | ----------------------------------------- | --------------------------------------- |
| GET    | `/api/v1/final/dns-changes`               | List DNS change requests (paginated)    |
| GET    | `/api/v1/final/dns-changes/:id`           | Get single request                      |
| POST   | `/api/v1/final/dns-changes`               | Create request                          |
| PATCH  | `/api/v1/final/dns-changes/:id`           | Update request                          |
| DELETE | `/api/v1/final/dns-changes/:id`           | Delete request                          |
| POST   | `/api/v1/final/dns-changes/:id/approve`   | Approve a pending request               |
| POST   | `/api/v1/final/dns-changes/:id/reject`    | Reject a pending request                |
| POST   | `/api/v1/final/dns-changes/:id/implement` | Mark an approved request as implemented |

## Data Model

### dns_change_requests

| Column             | Type        | Constraints                      | Description                     |
| ------------------ | ----------- | -------------------------------- | ------------------------------- |
| id                 | uuid        | PK, default gen_random_uuid()    | Unique identifier               |
| organization_id    | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                  |
| domain             | text        | NOT NULL                         | Domain being changed            |
| change_type        | text        | NOT NULL                         | Record type (e.g. A, CNAME, MX) |
| change_description | text        |                                  | Description of the change       |
| proposed_value     | text        |                                  | Proposed record value           |
| current_value      | text        |                                  | Current record value            |
| status             | text        | NOT NULL, default 'pending'      | Workflow status                 |
| approved_by        | uuid        | FK → auth.users(id)              | Approver                        |
| implemented_at     | timestamptz |                                  | When the change was implemented |
| created_by         | uuid        | FK → auth.users(id)              | Creator                         |
| created_at         | timestamptz | NOT NULL, default now()          | Creation timestamp              |
| updated_at         | timestamptz | NOT NULL, default now()          | Last update timestamp           |

## Workflows

### Approval Lifecycle

1. Request created with domain, `change_type`, description, and `proposed_value`; status `pending`
2. **Approve** — `POST /dns-changes/:id/approve` transitions `pending` → `approved`, sets `approved_by` (only pending requests can be approved; otherwise `INVALID_STATE`)
3. **Reject** — `POST /dns-changes/:id/reject` transitions `pending` → `rejected`
4. **Implement** — `POST /dns-changes/:id/implement` transitions `approved` → `implemented` and sets `implemented_at`
5. Each transition writes an audit event (`dns_change.approved`, `dns_change.rejected`, `dns_change.implemented`)

### Status Guardrails

- The API enforces state transitions server-side: approve/reject only from `pending`, implement only from `approved`
- Invalid transitions return `INVALID_STATE` (400) instead of silently changing data

## AI Review Rules

- AI may draft change descriptions, rollback notes, and impact summaries
- All AI outputs stored in `ai_draft_outputs` with status `draft`
- Human review required before applying to actual DNS change requests
- Store `prompt_key`, `prompt_version`, and `reviewer_status` for traceability

## Troubleshooting

| Issue                      | Resolution                                                              |
| -------------------------- | ----------------------------------------------------------------------- |
| Cannot approve a request   | Verify status is `pending`; only pending requests are approvable        |
| Cannot implement a request | Verify status is `approved`; only approved requests can be implemented  |
| 400 INVALID_STATE          | Confirm current status matches the expected pre-state of the transition |
| Request card not shown     | Verify org has rows in `dns_change_requests`; check RLS policies        |
| RLS policy denies access   | Confirm user has an approved membership in the organization             |

## Release Checklist

- [ ] Migration `5302074_final_batch.sql` applied
- [ ] API routes registered in `apps/api/src/routes/final.ts`
- [ ] Validator `dns` in `apps/api/src/validators/final.ts`
- [ ] SDK module `final.dnsChanges` exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/dns-changes/`
- [ ] Unit tests pass: `pnpm --filter=api test final`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/dns-changes.spec.ts`
- [ ] Feature doc added to `docs/features/dns-change-request-approvals.md`
- [ ] Runbook added to `docs/runbooks/dns-change-request-approvals.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
