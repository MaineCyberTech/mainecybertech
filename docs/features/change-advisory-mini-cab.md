# Change Advisory (Mini-CAB)

## Purpose

Lightweight change approval workflow for client environments. Engineers submit change requests, a mini-CAB reviews them, and approved changes are implemented and verified. Supports standard, emergency, and major change types with risk classification and rollback plans.

Primary users: MSP engineer (requester), change approver, admin

Business impact: Very High

Category: governance

## Permissions

| Action                | Roles                         |
| --------------------- | ----------------------------- |
| List change requests  | All authenticated org members |
| View change request   | All authenticated org members |
| Create change request | admin, super_admin            |
| Update change request | admin, super_admin            |
| Submit for review     | admin, super_admin            |
| Approve / reject      | admin, super_admin            |
| Implement / verify    | admin, super_admin            |

## Routes

### Portal Routes

| Route                         | Description                          |
| ----------------------------- | ------------------------------------ |
| `GET /portal/change-requests` | List change requests for current org |

### API Routes

| Method | Endpoint                                           | Description                                         |
| ------ | -------------------------------------------------- | --------------------------------------------------- |
| GET    | `/api/v1/governance/change-requests`               | List change requests (paginated)                    |
| GET    | `/api/v1/governance/change-requests/:id`           | Get a single change request                         |
| POST   | `/api/v1/governance/change-requests`               | Create a change request                             |
| PATCH  | `/api/v1/governance/change-requests/:id`           | Update a change request                             |
| DELETE | `/api/v1/governance/change-requests/:id`           | Delete a change request                             |
| POST   | `/api/v1/governance/change-requests/:id/submit`    | Submit draft for review (status → `pending_review`) |
| POST   | `/api/v1/governance/change-requests/:id/approve`   | Approve pending request                             |
| POST   | `/api/v1/governance/change-requests/:id/reject`    | Reject pending request                              |
| POST   | `/api/v1/governance/change-requests/:id/implement` | Mark approved request as implemented                |
| POST   | `/api/v1/governance/change-requests/:id/verify`    | Mark implemented request as verified                |

## Data Model

### change_requests

| Column              | Type        | Constraints                      | Description                                                         |
| ------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------- |
| id                  | uuid        | PK, default gen_random_uuid()    | Unique identifier                                                   |
| organization_id     | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                                                      |
| title               | text        | NOT NULL                         | Change request title                                                |
| description         | text        |                                  | Description of the change                                           |
| change_type         | text        | NOT NULL, default 'standard'     | standard / emergency / major                                        |
| risk_level          | text        | default 'low'                    | low / medium / high / critical                                      |
| rollback_plan       | text        |                                  | Steps to revert the change                                          |
| implementation_date | timestamptz |                                  | Scheduled implementation                                            |
| verification_steps  | text        |                                  | How the change will be verified                                     |
| status              | text        | NOT NULL, default 'draft'        | draft → pending_review → approved/rejected → implemented → verified |
| requester_id        | uuid        | FK → auth.users(id)              | Person requesting the change                                        |
| approver_id         | uuid        | FK → auth.users(id)              | Person who approved                                                 |
| implemented_by      | uuid        | FK → auth.users(id)              | Person who implemented                                              |
| implemented_at      | timestamptz |                                  | Implementation timestamp                                            |
| created_by          | uuid        | FK → auth.users(id)              | Author                                                              |
| created_at          | timestamptz | NOT NULL, default now()          | Creation timestamp                                                  |
| updated_at          | timestamptz | NOT NULL, default now()          | Last update timestamp                                               |

Note: the status transition handlers update `status` (plus `approver_id`/`implemented_at` where relevant). The base table does not define `submitted_at`/`verified_at` columns; those fields, where needed, must be tracked elsewhere (e.g., via audit log events).

## Workflows

### Change Lifecycle

1. **Draft** — Engineer creates the change request with title, description, change type, risk level, rollback plan, and verification steps
2. **Submit** — `POST /:id/submit` moves status to `pending_review`
3. **Approve / Reject** — Mini-CAB approves (`status → approved`) or rejects (`status → rejected`); only `pending_review` requests can be decided
4. **Implement** — `POST /:id/implement` requires status `approved`; sets `implemented_at`
5. **Verify** — `POST /:id/verify` requires status `implemented`; sets `verified_at` and closes the loop

Every transition logs an audit event (`change_request.submitted/approved/rejected/implemented/verified`).

### Portal Display

- Lists change requests scoped to the approved membership org with `StatusPill`, priority/type, and scheduled date
- Empty state renders "No change requests yet."

## Troubleshooting

| Issue                | Resolution                                                     |
| -------------------- | -------------------------------------------------------------- |
| Submit returns 409   | Request is not in `draft` status                               |
| Approve/reject fails | Request must be `pending_review`                               |
| Implement fails      | Request must be `approved`                                     |
| Verify fails         | Request must be `implemented`                                  |
| List empty           | Verify org has change requests and `organization_id` is passed |

## Release Checklist

- [ ] Migration `5302071_governance.sql` applied (`change_requests` table)
- [ ] API routes registered in `apps/api/src/routes/governance.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts` (`governance.changes`)
- [ ] Portal page created in `apps/web/app/(portal)/portal/change-requests/`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/change-requests.spec.ts`
- [ ] Feature doc added to `docs/features/change-advisory-mini-cab.md`
- [ ] Runbook added to `docs/runbooks/change-advisory-mini-cab.md`
