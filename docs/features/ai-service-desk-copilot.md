# AI Service Desk Copilot

## Purpose

AI-assisted ticket intake triage and support copilot for the service desk. Analyzes raw end-user issue descriptions, suggests a category/priority/subject, flags missing information, and lets technicians convert approved drafts into real tickets. Also provides ticket summarization and AI reply-drafting for the copilot console.

Primary users: service desk technician, client support admin, client user

Business impact: High

Category: ai

## Permissions

| Action                    | Roles                          |
| ------------------------- | ------------------------------ |
| List triage drafts        | All authenticated org members  |
| Analyze a new description | All authenticated org members  |
| Convert draft to ticket   | admin, super_admin, technician |
| Summarize a ticket        | admin, super_admin, technician |
| Draft a ticket reply      | admin, super_admin, technician |

## Routes

### Portal Routes

| Route                   | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `GET /portal/ai-triage` | List AI triage drafts for current organization |

### API Routes

| Method | Endpoint                                   | Description                                |
| ------ | ------------------------------------------ | ------------------------------------------ |
| POST   | `/api/v1/ai/triage/analyze`                | Analyze a raw description and save a draft |
| GET    | `/api/v1/ai/triage`                        | List triage drafts (paginated, filterable) |
| POST   | `/api/v1/ai/triage/convert`                | Convert a draft into a ticket              |
| GET    | `/api/v1/ai/copilot/:ticketId/summarize`   | Summarize a ticket thread                  |
| POST   | `/api/v1/ai/copilot/:ticketId/reply-draft` | Draft a reply with a chosen tone           |

## Data Model

### ticket_triage_drafts

| Column               | Type        | Constraints                      | Description                         |
| -------------------- | ----------- | -------------------------------- | ----------------------------------- |
| id                   | uuid        | PK, default gen_random_uuid()    | Unique identifier                   |
| organization_id      | uuid        | FK → organizations(id), NOT NULL | Tenant scoping                      |
| raw_description      | text        | NOT NULL                         | Original end-user issue description |
| suggested_category   | text        |                                  | Category keyword match              |
| suggested_priority   | text        | NOT NULL, default 'normal'       | Priority hint                       |
| suggested_subject    | text        |                                  | Generated subject line              |
| missing_info         | text[]      |                                  | Flags of missing details            |
| first_response_draft | text        |                                  | Draft first reply                   |
| confidence_score     | integer     | NOT NULL, default 0              | 0-100 confidence estimate           |
| status               | text        | NOT NULL, default 'draft'        | draft/analyzed/pending/converted    |
| converted_ticket_id  | uuid        | FK → tickets(id)                 | Ticket created from this draft      |
| reviewed_by          | uuid        | FK → auth.users(id)              | User who reviewed the draft         |
| reviewed_at          | timestamptz |                                  | Review timestamp                    |
| created_by           | uuid        | FK → auth.users(id)              | Draft author                        |
| metadata             | jsonb       | NOT NULL, default '{}'           | Additional analysis metadata        |
| created_at           | timestamptz | NOT NULL, default now()          | Creation timestamp                  |
| updated_at           | timestamptz | NOT NULL, default now()          | Last update timestamp               |

## Workflows

### Analyze a Description

1. Technician or user pastes the raw issue description into the triage console
2. `POST /api/v1/ai/triage/analyze` runs keyword analysis across six categories (hardware, software, network, email, access, security)
3. System saves a `ticket_triage_drafts` row with suggested category, priority, subject, missing-info flags, and confidence score
4. An audit event `triage.analyzed` is logged
5. The draft appears in the portal triage list

### Convert Draft to Ticket

1. Technician reviews a draft in `/portal/ai-triage`
2. `POST /api/v1/ai/triage/convert` creates a ticket from the draft
3. The draft status flips to `converted` and `converted_ticket_id` is set
4. An audit event `triage.converted_to_ticket` is logged

### Copilot Summarize

- `GET /api/v1/ai/copilot/:ticketId/summarize` returns ticket metadata, comment count, last activity, key points, and a suggested next action

### Reply Drafting

- `POST /api/v1/ai/copilot/:ticketId/reply-draft` generates a reply draft in one of four tones (formal, friendly, technical, concise) referencing the latest thread comments

## AI Review Rules

- All AI analysis is heuristic keyword matching — no external LLM is invoked
- Drafts are never automatically converted to tickets; a human must approve
- Confidence scores and missing-info flags are stored for technician review
- All copilot actions are recorded in the audit log for traceability

## Troubleshooting

| Issue                     | Resolution                                                          |
| ------------------------- | ------------------------------------------------------------------- |
| Empty triage list         | No drafts analyzed for the org; run analyze first                   |
| Category always "general" | Description has no matching keywords; review the description        |
| Convert returns 404       | Draft not found in the organization; check draft id and org scoping |
| Draft stuck in "draft"    | Use the convert endpoint which advances status to "converted"       |
| RLS policy denies access  | Confirm user has an approved membership in the organization         |

## Release Checklist

- [ ] Migration `5302065_ticket_triage.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] Validators created in `apps/api/src/validators/ai.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/ai-triage/`
- [ ] Unit tests pass: `pnpm --filter=api test ai`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/ai-triage.spec.ts`
- [ ] Feature doc added to `docs/features/ai-service-desk-copilot.md`
- [ ] Runbook added to `docs/runbooks/ai-service-desk-copilot.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
