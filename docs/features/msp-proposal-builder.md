# MSP Proposal Builder

## Purpose

Pricing engine for client-facing MSP proposals. Proposals contain phases (sections) and line items (labor, materials, recurring, one-time) with an automatic total computation across `total_labor`, `total_materials`, `total_recurring`, `total_one_time`, and `grand_total`. Supports the full lifecycle: draft → submit for approval → sent → approved → published client-visible, with an approval request linkage and publication to clients with a validity window.

Primary users: MSP sales engineer, account manager, service delivery lead

Business impact: High

Category: tools

## Permissions

Permission module key: `proposals` (view / create / edit / delete)

| Action                        | Roles                          |
| ----------------------------- | ------------------------------ |
| List/view proposals           | All authenticated org members  |
| Create proposal               | admin, super_admin, technician |
| Update proposal               | admin, super_admin, technician |
| Delete proposal               | admin, super_admin             |
| Submit for approval / publish | admin, super_admin             |

## Routes

### Portal Routes

| Route                       | Description                             |
| --------------------------- | --------------------------------------- |
| `GET /portal/proposals`     | List proposals for the organization     |
| `GET /portal/proposals/:id` | Proposal detail (phases, items, totals) |

### Admin Routes

| Route                      | Description               |
| -------------------------- | ------------------------- |
| `GET /admin/proposals`     | Admin proposal management |
| `GET /admin/proposals/new` | Create proposal form      |
| `GET /admin/proposals/:id` | Edit proposal detail      |

### API Routes

| Method | Endpoint                                | Description                                                |
| ------ | --------------------------------------- | ---------------------------------------------------------- |
| GET    | `/api/v1/proposals/export`              | CSV/JSON export (10,000 row cap)                           |
| GET    | `/api/v1/proposals`                     | List proposals (filters: status, search)                   |
| GET    | `/api/v1/proposals/:id`                 | Get proposal + phases + items + comments + timeline        |
| POST   | `/api/v1/proposals`                     | Create proposal with phases + line items (totals computed) |
| PATCH  | `/api/v1/proposals/:id`                 | Update proposal (If-Match optimistic locking)              |
| DELETE | `/api/v1/proposals/:id`                 | Delete proposal                                            |
| POST   | `/api/v1/proposals/:id/phases`          | Add phase                                                  |
| PATCH  | `/api/v1/proposals/:id/phases/:phaseId` | Update phase                                               |
| DELETE | `/api/v1/proposals/:id/phases/:phaseId` | Delete phase                                               |
| POST   | `/api/v1/proposals/:id/items`           | Add line item (total computed)                             |
| PATCH  | `/api/v1/proposals/:id/items/:itemId`   | Update line item                                           |
| DELETE | `/api/v1/proposals/:id/items/:itemId`   | Delete line item                                           |
| POST   | `/api/v1/proposals/:id/submit-approval` | Create approval request, move draft → sent                 |
| POST   | `/api/v1/proposals/:id/publish`         | Publish approved proposal client-visible                   |
| GET    | `/api/v1/proposals/:id/comments`        | List proposal comments                                     |
| POST   | `/api/v1/proposals/:id/comments`        | Add proposal comment                                       |
| GET    | `/api/v1/proposals/:id/timeline`        | List proposal timeline events                              |

## Data Model

### proposals

| Column              | Type          | Constraints                      | Description                                  |
| ------------------- | ------------- | -------------------------------- | -------------------------------------------- |
| id                  | uuid          | PK, default gen_random_uuid()    | Unique identifier                            |
| organization_id     | uuid          | FK → organizations(id), NOT NULL | Tenant scoping                               |
| title               | text          | NOT NULL                         | Proposal title                               |
| description         | text          |                                  | Proposal description                         |
| status              | text          | NOT NULL, default 'draft'        | draft / sent / approved / rejected / expired |
| visibility          | text          | NOT NULL, default 'internal'     | internal / client_visible                    |
| total_labor         | numeric(12,2) | NOT NULL, default 0              | Sum of labor line items                      |
| total_materials     | numeric(12,2) | NOT NULL, default 0              | Sum of materials line items                  |
| total_recurring     | numeric(12,2) | NOT NULL, default 0              | Sum of recurring line items                  |
| total_one_time      | numeric(12,2) | NOT NULL, default 0              | Sum of one-time line items                   |
| grand_total         | numeric(12,2) | NOT NULL, default 0              | Sum of all totals                            |
| valid_until         | timestamptz   |                                  | Validity window (set on publish)             |
| sent_at             | timestamptz   |                                  | Submitted-for-approval time                  |
| approved_at         | timestamptz   |                                  | Approval time                                |
| rejected_at         | timestamptz   |                                  | Rejection time                               |
| expires_at          | timestamptz   |                                  | Expiry time                                  |
| approval_request_id | uuid          | FK → approval_requests(id)       | Linked approval request                      |
| owner_user_id       | uuid          | FK → auth.users(id)              | Proposal owner                               |
| created_by          | uuid          | FK → auth.users(id)              | Creator                                      |
| updated_by          | uuid          | FK → auth.users(id)              | Last updater                                 |
| approved_by         | uuid          | FK → auth.users(id)              | Approver                                     |
| metadata            | jsonb         | NOT NULL, default '{}'           | Extensible metadata                          |
| version             | integer       | NOT NULL, default 1              | Optimistic locking                           |
| created_at          | timestamptz   | NOT NULL, default now()          | Creation timestamp                           |
| updated_at          | timestamptz   | NOT NULL, default now()          | Last update timestamp                        |

### proposal_phases

| Column      | Type    | Constraints                                      | Description       |
| ----------- | ------- | ------------------------------------------------ | ----------------- |
| id          | uuid    | PK, default gen_random_uuid()                    | Unique identifier |
| proposal_id | uuid    | FK → proposals(id), NOT NULL (on delete cascade) | Parent proposal   |
| sort_order  | integer | NOT NULL, default 0                              | Display order     |
| title       | text    | NOT NULL                                         | Phase title       |
| description | text    |                                                  | Phase description |
| assumptions | text    |                                                  | Assumptions       |
| notes       | text    |                                                  | Notes             |

### proposal_line_items

| Column             | Type          | Constraints                   | Description                        |
| ------------------ | ------------- | ----------------------------- | ---------------------------------- |
| id                 | uuid          | PK, default gen_random_uuid() | Unique identifier                  |
| proposal_id        | uuid          | FK → proposals(id), NOT NULL  | Parent proposal                    |
| phase_id           | uuid          | FK → proposal_phases(id)      | Owning phase (nullable)            |
| sort_order         | integer       | NOT NULL, default 0           | Display order                      |
| item_type          | text          | NOT NULL, default 'labor'     | labor/materials/recurring/one_time |
| name               | text          | NOT NULL                      | Line item name                     |
| description        | text          |                               | Line item description              |
| quantity           | numeric(12,2) | NOT NULL, default 1           | Quantity                           |
| unit_price         | numeric(12,2) | NOT NULL, default 0           | Unit price                         |
| total_price        | numeric(12,2) | NOT NULL, default 0           | Computed total                     |
| is_optional        | boolean       | NOT NULL, default false       | Optional item                      |
| is_recurring       | boolean       | NOT NULL, default false       | Recurring item                     |
| recurring_interval | text          | NOT NULL, default 'monthly'   | monthly / quarterly / annually     |

## Workflows

### Create Proposal with Pricing

1. POST `/api/v1/proposals` with `title`, `visibility`, optional `validUntil`, and `phases[]` each containing `items[]`
2. Server computes each item's `total_price` (`totalPrice` override or `quantity * unitPrice`)
3. Server rolls totals into `total_labor`, `total_materials`, `total_recurring`, `total_one_time`, `grand_total`
4. Creates proposal + phases + line items, logs `proposal.created`, adds timeline event

### Submit for Approval

1. `POST /:id/submit-approval` validates the proposal is `draft`
2. Creates an `approval_requests` row (type `proposal_approval`, priority `high`) with `request_metadata.proposalId` and `grandTotal`
3. Moves proposal to `sent` and sets `sent_at` + `approval_request_id`

### Publish to Client

1. `POST /:id/publish` validates the proposal is `approved`
2. Sets `visibility = client_visible`, `valid_until = now + validityDays`, increments `version`
3. Publishes to the client portal (`GET /portal/proposals/:id`) with submit action

### Optimistic Locking

- PATCH requires `If-Match` with the current `version`
- Concurrent edits return 409 `VERSION_CONFLICT`

## AI Review Rules

- AI may draft proposal phases, line-item descriptions, and assumptions
- Outputs stored in `ai_draft_outputs` with `status = 'draft'`; human review before use
- No AI-generated pricing applied without human review

## Troubleshooting

| Issue                      | Resolution                                                        |
| -------------------------- | ----------------------------------------------------------------- |
| PATCH returns 409          | Concurrent modification; re-fetch proposal (`version`) and retry  |
| Publish rejected           | Only `approved` proposals can be published (INVALID_STATE)        |
| Submit rejected            | Only `draft` proposals can be submitted (INVALID_STATE)           |
| Totals don't add up        | Totals are server-computed on create; PATCH only updates metadata |
| Portal proposal detail 404 | Confirm proposal belongs to the active org                        |

## Release Checklist

- [ ] Migration `5302059_proposal_builder.sql` applied (proposals + proposal_phases + proposal_line_items + RLS)
- [ ] Permission keys `proposals:view/create/edit/delete` seeded (5302118)
- [ ] API routes in `apps/api/src/routes/proposals.ts` (CRUD + phases + items + submit-approval + publish + comments + timeline)
- [ ] Validators in `apps/api/src/validators/proposals.ts`
- [ ] Optimistic locking middleware wired
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal pages `apps/web/app/(portal)/portal/proposals/` (list + `[id]` detail) render
- [ ] Admin pages `apps/web/app/(admin)/admin/proposals/` (list + new + edit) render
- [ ] E2E passes: `pnpm e2e --project=chromium apps/web/e2e/portal/proposals.spec.ts`
- [ ] Feature doc: this file
- [ ] Runbook: `docs/runbooks/msp-proposal-builder.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
