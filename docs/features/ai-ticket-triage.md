# AI Ticket Triage

## Purpose

AI-assisted intake assistant that analyzes raw ticket descriptions and produces a structured triage suggestion: category, priority, subject, missing information checklist, confidence score, and a first-response draft. Reviewed drafts can be converted directly into real tickets.

Primary users: MSP help desk technicians, client users, dispatcher

Business impact: High

Category: operations

## Permissions

| Action                     | Roles                         |
| -------------------------- | ----------------------------- |
| List triage drafts         | All authenticated org members |
| Analyze a description      | All authenticated org members |
| Convert draft to ticket    | All authenticated org members |
| Summarize / reply-draft    | All authenticated org members |
| Create a ticket from draft | All authenticated org members |

## Routes

### Portal Routes

| Route                   | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `GET /portal/ai-triage` | List AI triage drafts for current organization |

### Admin Routes

| Route           | Description                         |
| --------------- | ----------------------------------- |
| `GET /admin/ai` | AI Service Desk Tools page (triage) |

### API Routes

| Method | Endpoint                                   | Description                                  |
| ------ | ------------------------------------------ | -------------------------------------------- |
| POST   | `/api/v1/ai/triage/analyze`                | Analyze a raw description and create a draft |
| POST   | `/api/v1/ai/triage/convert`                | Convert a triage draft into a real ticket    |
| GET    | `/api/v1/ai/triage`                        | List triage drafts (paginated, org-scoped)   |
| GET    | `/api/v1/ai/copilot/:ticketId/summarize`   | Summarize a ticket thread for the technician |
| POST   | `/api/v1/ai/copilot/:ticketId/reply-draft` | Generate a draft reply with a tone parameter |

## Data Model

### ticket_triage_drafts

| Column               | Type        | Constraints                         | Description                                     |
| -------------------- | ----------- | ----------------------------------- | ----------------------------------------------- |
| id                   | uuid        | PK, default gen_random_uuid()       | Unique identifier                               |
| organization_id      | uuid        | FK → organizations(id), NOT NULL    | Tenant scoping                                  |
| raw_description      | text        | NOT NULL                            | Original issue description                      |
| suggested_category   | text        |                                     | Keyword-based category (hardware, network, ...) |
| suggested_priority   | text        | default 'normal'                    | high/normal from urgency hints                  |
| suggested_subject    | text        |                                     | Auto-generated subject line                     |
| missing_info         | text[]      |                                     | Missing details detected                        |
| first_response_draft | text        |                                     | Draft of initial response                       |
| confidence_score     | integer     | default 0                           | 0-100 confidence in the suggestion              |
| status               | text        | NOT NULL, default 'draft'           | draft → analyzed → converted                    |
| converted_ticket_id  | uuid        | FK → tickets(id) on delete set null | Resulting ticket                                |
| reviewed_by          | uuid        | FK → auth.users(id)                 | User who reviewed/converted                     |
| reviewed_at          | timestamptz |                                     | Review timestamp                                |
| created_by           | uuid        | FK → auth.users(id)                 | Who submitted the analysis                      |
| metadata             | jsonb       | NOT NULL, default '{}'              | Additional context                              |
| created_at           | timestamptz | NOT NULL, default now()             | Creation timestamp                              |
| updated_at           | timestamptz | NOT NULL, default now()             | Last update timestamp                           |

## Workflows

### Analyze

1. User pastes a raw ticket description into the triage tool
2. API keyword-scans the text across category lexicons (hardware, software, network, email, access, security)
3. Suggests category, priority (urgency keywords), subject, and missing information
4. Stores a `ticket_triage_drafts` row with status `analyzed` and a confidence score
5. Audits with `triage.analyzed`

### Convert to Ticket

1. Technician reviews the draft and optionally edits subject/category/priority
2. `POST /ai/triage/convert` creates a real ticket and flips the draft to `converted`
3. `converted_ticket_id`, `reviewed_by`, `reviewed_at` are set
4. Audits with `triage.converted_to_ticket`

### Copilot Summarize / Reply Draft

- `summarize` returns ticket status, priority, comment count, last activity, and a suggested next action
- `reply-draft` accepts a tone (`formal`, `friendly`, `technical`, `concise`) and returns a draft reply referencing the latest comment

## AI Review Rules

- Keyword-based heuristics only — no external model calls
- Drafts are always reviewed by a human before conversion
- Confidence is derived from keyword coverage; low-confidence drafts should be manually triaged
- All AI outputs are persisted with status and reviewer metadata for traceability

## Troubleshooting

| Issue                          | Resolution                                                          |
| ------------------------------ | ------------------------------------------------------------------- |
| Analyze returns wrong category | Adjust keyword coverage in `apps/api/src/routes/ai.ts`              |
| Draft won't convert            | Verify the draft id and organization match the caller's memberships |
| Triage list empty              | Verify `organization_id` filter and RLS membership scoping          |
| Confidence always low          | Raw descriptions are short or keyword-poor; enrich before submit    |

## Release Checklist

- [ ] Migration `5302065_ticket_triage.sql` applied
- [ ] API routes registered at `/api/v1/ai` in `apps/api/src/app.ts`
- [ ] SDK module `ai` exported from `packages/sdk/src/index.ts`
- [ ] Portal page at `apps/web/app/(portal)/portal/ai-triage/`
- [ ] E2E tests pass: `pnpm e2e apps/web/e2e/portal/ai-triage.spec.ts`
- [ ] Feature doc added to `docs/features/ai-ticket-triage.md`
- [ ] Runbook added to `docs/runbooks/ai-ticket-triage.md`
