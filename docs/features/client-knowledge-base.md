# Client Knowledge Base

## Purpose

Client-facing knowledge base of published articles covering how-to guides, FAQ entries, and policy documentation. Supports categorization, tags, publish state, view counts, and helpfulness ratings.

Primary users: client users, helpdesk, KB author

Business impact: Medium

Category: self-service

## Permissions

| Action                   | Roles                         |
| ------------------------ | ----------------------------- |
| List knowledge articles  | All authenticated org members |
| View article             | All authenticated org members |
| Create article           | admin, super_admin            |
| Update article           | admin, super_admin            |
| Delete article           | admin, super_admin            |
| Rate article helpfulness | All authenticated org members |
| Search articles          | All authenticated org members |

## Routes

### Portal Routes

| Route                               | Description                             |
| ----------------------------------- | --------------------------------------- |
| `GET /portal/client-knowledge-base` | List knowledge articles for current org |

### Admin Routes

| Route                              | Description         |
| ---------------------------------- | ------------------- |
| `GET /admin/edu-automation/kb`     | Article list        |
| `GET /admin/edu-automation/kb/:id` | Article detail/edit |

### API Routes

| Method | Endpoint                              | Description                           |
| ------ | ------------------------------------- | ------------------------------------- |
| GET    | `/api/v1/edu-automation/kb`           | List articles (paginated, org-scoped) |
| GET    | `/api/v1/edu-automation/kb/:id`       | Get single article                    |
| POST   | `/api/v1/edu-automation/kb`           | Create article                        |
| PATCH  | `/api/v1/edu-automation/kb/:id`       | Update article                        |
| DELETE | `/api/v1/edu-automation/kb/:id`       | Delete article                        |
| GET    | `/api/v1/edu-automation/kb/search?q=` | Search title/content/category         |
| POST   | `/api/v1/edu-automation/kb/:id/rate`  | Rate article helpful/not-helpful      |

## Data Model

### knowledge_articles

| Column            | Type        | Constraints                      | Description           |
| ----------------- | ----------- | -------------------------------- | --------------------- |
| id                | uuid        | PK, default gen_random_uuid()    | Unique identifier     |
| organization_id   | uuid        | FK → organizations(id), NOT NULL | Tenant scoping        |
| title             | text        | NOT NULL                         | Article title         |
| content           | text        |                                  | Article body          |
| category          | text        |                                  | Article category      |
| tags              | text[]      |                                  | Searchable tags       |
| is_published      | boolean     | default false                    | Publish state         |
| view_count        | integer     | default 0                        | View counter          |
| helpful_count     | integer     | default 0                        | Helpful ratings       |
| not_helpful_count | integer     | default 0                        | Not-helpful ratings   |
| created_by        | uuid        | FK → auth.users(id)              | Author                |
| created_at        | timestamptz | NOT NULL, default now()          | Creation timestamp    |
| updated_at        | timestamptz | NOT NULL, default now()          | Last update timestamp |

## Workflows

### Search & Browse

- Portal lists articles for the active org, showing category, publish state, and a content excerpt
- `GET /kb/search?q=` searches title/content/category with `ilike` across all three fields

### Rating

- `POST /kb/:id/rate` with `{ helpful: true|false }` increments `helpful_count` or `not_helpful_count` via the `increment_article_count` RPC

### KB Article Generation

- Admin `kb-generator` (`kb_article_generations`) can auto-draft an article from a ticket source; generated content must be reviewed before publishing to `knowledge_articles`

## AI Review Rules

- AI may draft article content from tickets or prompts (via `kb_article_generations`)
- Generated articles start as `draft` in the generator table; human review required
- Only reviewed content may be published to `knowledge_articles`

## Troubleshooting

| Issue                   | Resolution                                            |
| ----------------------- | ----------------------------------------------------- |
| Article list empty      | Verify org has articles; check RLS policy             |
| Search returns nothing  | Confirm query param `q` is present and content exists |
| Rating not incrementing | Verify `increment_article_count` RPC exists           |

## Release Checklist

- [ ] Table from migration `5302073_edu_automation.sql` applied
- [ ] API routes registered in `apps/api/src/app.ts`
- [ ] SDK module exported from `packages/sdk/src/index.ts`
- [ ] Portal page created in `apps/web/app/(portal)/portal/client-knowledge-base/`
- [ ] Unit tests pass: `pnpm --filter=api test edu-automation`
- [ ] E2E tests pass: `pnpm e2e --project=chromium apps/web/e2e/portal/knowledge-base.spec.ts`
- [ ] Feature doc added to `docs/features/client-knowledge-base.md`
- [ ] Runbook added to `docs/runbooks/client-knowledge-base.md`
- [ ] API inventory updated in `docs/API_ENDPOINT_INVENTORY.md`
