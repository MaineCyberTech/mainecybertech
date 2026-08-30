# Approval Workflow Engine

## Purpose

Generic approval workflow engine for structured decision requests across the platform. Any module can submit an approval request with metadata; reviewers approve, reject, or cancel, and the full lifecycle is tracked with comments and a timeline.

Primary users: MSP admin, client admin, technicians submitting requests

Business impact: High

Category: governance

## Permissions

| Action                  | Roles                         |
| ----------------------- | ----------------------------- |
| List approval requests  | All authenticated org members |
| View approval detail    | All authenticated org members |
| Create approval request | All authenticated org members |
| Update approval request | admin, super_admin            |
| Delete approval request | admin, super_admin            |
| Approve/reject/cancel   | admin, super_admin            |
| Add comments            | All authenticated org members |
| Export approvals        | admin, super_admin            |

## Routes

### Portal Routes

| Route                   | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `GET /portal/approvals` | List approval requests for current organization |

### API Routes

| Method | Endpoint                         | Description                            |
| ------ | -------------------------------- | -------------------------------------- |
| GET    | `/api/v1/approvals`              | List approvals (paginated, filterable) |
| GET    | `/api/v1/approvals/stats`        | Approval statistics                    |
| GET    | `/api/v1/approvals/export`       | Export approvals (CSV/JSON)            |
| GET    | `/api/v1/approvals/:id`          | Get single approval                    |
| POST   | `/api/v1/approvals`              | Create approval request                |
| PATCH  | `/api/v1/approvals/:id`          | Update approval request                |
| DELETE | `/api/v1/approvals/:id`          | Delete approval request                |
| POST   | `/api/v1/approvals/:id/approve`  | Approve the request                    |
| POST   | `/api/v1/approvals/:id/reject`   | Reject the request                     |
| POST   | `/api/v1/approvals/:id/cancel`   | Cancel the request                     |
| GET    | `/api/v1/approvals/:id/comments` | List comments                          |
| POST   | `/api/v1/approvals/:id/comments` | Add a comment                          |
| GET    | `/api/v1/approvals/:id/timeline` | Get approval timeline                  |

## Data Model

### approval_requests

| Column             | Type        | Constraints                      | Description                         |
| ------------------ | ----------- | -------------------------------- | ----------------------------------- |
| id                 | uuid        | PK, default gen_random_uuid()    | Unique identifier                   |
| organization_id    | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                      |
| request_type       | text        | NOT NULL                         | Type of request                     |
| request_subject    | text        | NOT NULL                         | Human-readable subject              |
| request_body       | text        |                                  | Detailed body                       |
| request_metadata   | jsonb       | NOT NULL, default '{}'           | Module-specific metadata            |
| source_module      | text        |                                  | Originating module                  |
| source_entity_type | text        |                                  | Originating entity type             |
| source_entity_id   | uuid        |                                  | Originating entity                  |
| status             | text        | NOT NULL, default 'pending'      | pending/approved/rejected/cancelled |
| priority           | text        | NOT NULL, default 'normal'       | normal/high/urgent                  |
| requested_by       | uuid        | FK → auth.users(id)              | Requester                           |
| assigned_to        | uuid        | FK → auth.users(id)              | Assigned reviewer                   |
| approved_by        | uuid        | FK → auth.users(id)              | Approver                            |
| rejected_by        | uuid        | FK → auth.users(id)              | Rejector                            |
| approved_at        | timestamptz |                                  | Approval timestamp                  |
| rejected_at        | timestamptz |                                  | Rejection timestamp                 |
| rejection_reason   | text        |                                  | Reason for rejection                |
| due_at             | timestamptz |                                  | Decision deadline                   |
| visibility         | text        | NOT NULL, default 'internal'     | internal/public                     |
| version            | integer     | NOT NULL, default 1              | Optimistic locking                  |
| created_at         | timestamptz | NOT NULL, default now()          | Creation timestamp                  |
| updated_at         | timestamptz | NOT NULL, default now()          | Last update timestamp               |

## Workflows

### Request Creation

1. A module or user creates a request with `request_type`, `request_subject`, and metadata
2. `POST /api/v1/approvals` stores the request with status `pending`
3. Request appears in the portal approvals list with status and priority badges

### Decision Flow

- **Approve** — `POST /api/v1/approvals/:id/approve` sets status `approved`, records `approved_by` and `approved_at`
- **Reject** — `POST /api/v1/approvals/:id/reject` sets status `rejected`, records `rejected_by`, `rejected_at`, and `rejection_reason`
- **Cancel** — `POST /api/v1/approvals/:id/cancel` cancels the request

### Commenting and Audit

- Comments are stored per request and surfaced in the portal
- A timeline of lifecycle events is available via `GET /api/v1/approvals/:id/timeline`

## AI Review Rules

- AI may draft approval request bodies and summaries
- All AI outputs require human review before submission
- Approval decisions are never automated

## Troubleshooting

| Issue                    | Resolution                                                           |
| ------------------------ | -------------------------------------------------------------------- |
| Approval list empty      | No requests created for the org                                      |
| Approve returns 400      | Request may already be decided; only pending requests can be decided |
| Optimistic lock error    | Refresh and retry; another user modified the request concurrently    |
| Comments missing         | Verify comments exist via `GET /api/v1/approvals/:id/comments`       |
| RLS policy denies access | Confirm user has membership in the organization                      |

## Release Checklist

- [ ] Migration `5302058_shared_module_tables.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] Validators created in `apps/api/src/validators/approvals.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/approvals/`
- [ ] Unit tests pass: `pnpm --filter=api test approvals`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/approvals.spec.ts`
- [ ] Feature doc added to `docs/features/approval-workflow-engine.md`
- [ ] Runbook added to `docs/runbooks/approval-workflow-engine.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
