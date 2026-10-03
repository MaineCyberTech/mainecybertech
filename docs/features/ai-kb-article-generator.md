# AI KB Article Generator

## Purpose

Generate knowledge base article drafts from source tickets or source titles, review and publish them, and track the generation lifecycle (draft → generated → published). Reduces the effort of converting resolved tickets into client-facing KB articles.

Primary users: MSP service desk lead, KB administrator, technician

Business impact: Medium

Category: edu_automation

## Permissions

| Action               | Roles                         |
| -------------------- | ----------------------------- |
| List KB generations  | All authenticated org members |
| View KB generation   | All authenticated org members |
| Create KB generation | admin, super_admin            |
| Update KB generation | admin, super_admin            |
| Delete KB generation | admin, super_admin            |
| Trigger generation   | admin, super_admin            |

## Routes

### Portal Routes

| Route                               | Description                           |
| ----------------------------------- | ------------------------------------- |
| `GET /portal/client-knowledge-base` | List generated and published articles |

### API Routes

| Method | Endpoint                                           | Description                              |
| ------ | -------------------------------------------------- | ---------------------------------------- |
| GET    | `/api/v1/edu-automation/kb-generator`              | List generation records (paginated)      |
| GET    | `/api/v1/edu-automation/kb-generator/:id`          | Get single generation record             |
| POST   | `/api/v1/edu-automation/kb-generator`              | Create generation record                 |
| PATCH  | `/api/v1/edu-automation/kb-generator/:id`          | Update generation record                 |
| DELETE | `/api/v1/edu-automation/kb-generator/:id`          | Delete generation record                 |
| POST   | `/api/v1/edu-automation/kb-generator/:id/generate` | Generate article content from the record |

## Data Model

### kb_article_generations

| Column            | Type        | Constraints                          | Description                    |
| ----------------- | ----------- | ------------------------------------ | ------------------------------ |
| id                | uuid        | PK, default gen_random_uuid()        | Unique identifier              |
| organization_id   | uuid        | FK → organizations(id), NOT NULL     | Tenant scoping                 |
| source_ticket_id  | uuid        | FK → tickets(id), ON DELETE SET NULL | Source ticket                  |
| source_title      | text        |                                      | Title used as generation basis |
| generated_content | text        |                                      | AI-generated article body      |
| reviewed_content  | text        |                                      | Human-reviewed final content   |
| status            | text        | NOT NULL, default 'draft'            | Lifecycle status               |
| reviewed_by       | uuid        | FK → auth.users(id)                  | Reviewer                       |
| reviewed_at       | timestamptz |                                      | Review timestamp               |
| created_by        | uuid        | FK → auth.users(id)                  | Creator                        |
| created_at        | timestamptz | NOT NULL, default now()              | Creation timestamp             |
| updated_at        | timestamptz | NOT NULL, default now()              | Last update timestamp          |

## Workflows

### Generation

1. Technician creates a generation record from a resolved `source_ticket_id` or a `source_title`
2. `POST /kb-generator/:id/generate` drafts a structured article body using the source title
3. Generated content sets `status` to `generated` and records the actor as `reviewed_by`

### Review & Publish

- Human reviewer edits the draft into `reviewed_content`
- Final content is published to the knowledge base (see `knowledge_articles` module)
- The portal knowledge base page displays published articles with category and published state

## AI Review Rules

- AI generates draft article content only
- Generated content requires human review before publication
- Store `prompt_key`, `prompt_version`, and `reviewer_status` for traceability

## Troubleshooting

| Issue                    | Resolution                                                             |
| ------------------------ | ---------------------------------------------------------------------- |
| Article card not shown   | Verify org has rows in `knowledge_articles` / `kb_article_generations` |
| Generation returns 404   | Confirm the generation record id exists in the org                     |
| Empty generated content  | Confirm `source_title` was set before calling generate                 |
| RLS policy denies access | Confirm user has an approved membership in the organization            |
| Published flag wrong     | Confirm `is_published` on the final `knowledge_articles` row           |

## Release Checklist

- [ ] Migration `5302073_edu_automation.sql` applied
- [ ] API routes registered in `apps/api/src/routes/edu-automation.ts`
- [ ] Validator `kbGen` in `apps/api/src/validators/edu-automation.ts`
- [ ] SDK module `eduAutomation.kbGenerator` exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/client-knowledge-base/`
- [ ] Unit tests pass: `pnpm --filter=api test edu-automation`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/knowledge-base.spec.ts`
- [ ] Feature doc added to `docs/features/ai-kb-article-generator.md`
- [ ] Runbook added to `docs/runbooks/ai-kb-article-generator.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
