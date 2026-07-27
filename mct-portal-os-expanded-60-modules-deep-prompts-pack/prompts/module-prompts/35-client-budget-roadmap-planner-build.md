# Deep Build Prompt: Client Budget Roadmap Planner

You are implementing **Client Budget Roadmap Planner** in the existing MaineCyberTech portal/OS monorepo.

## Product intent

Plans technology budgets by quarter/year across replacements, projects, licenses, security, and lifecycle needs.

Primary users: MSP advisor, client executive
Category: client-success
Business impact: High
Required components: api,web,sdk,db

## Repository constraints

Follow existing patterns in the current repo. Do not introduce a parallel architecture.

Relevant anchors:

- API route folder: `apps/api/src/routes/`
- Validators: `apps/api/src/validators/`
- Services: `apps/api/src/services/`
- API registration: `apps/api/src/app.ts`
- SDK: `packages/sdk/src/`
- Portal route folder: `apps/web/app/(portal)/portal/`
- Portal components: `apps/web/components/portal/`
- Worker tasks: `apps/worker/src/tasks/`
- Migration folder: `supabase/migrations/`
- Tests: `apps/api/src/__tests__/`, `apps/web/e2e/portal/`

## Required file additions / changes

1. `supabase/migrations/<timestamp>_client_budget_roadmap_planner.sql`
2. `apps/api/src/validators/client-budget-roadmap-planner.ts`
3. `apps/api/src/services/client-budget-roadmap-planner.ts`
4. `apps/api/src/routes/client-budget-roadmap-planner.ts`
5. register the route in `apps/api/src/app.ts`
6. `packages/sdk/src/client-budget-roadmap-planner.ts`
7. export SDK module from `packages/sdk/src/index.ts`
8. `apps/web/app/(portal)/portal/client-budget-roadmap-planner/page.tsx`
9. `apps/web/app/(portal)/portal/client-budget-roadmap-planner/[id]/page.tsx` if detail route is useful
10. `apps/web/components/portal/ClientBudgetRoadmapPlanner/` components
11. `apps/worker/src/tasks/client-budget-roadmap-planner.ts` if components include worker
12. `apps/api/src/__tests__/client-budget-roadmap-planner.test.ts`
13. `apps/web/e2e/portal/client-budget-roadmap-planner.spec.ts`
14. `docs/features/client-budget-roadmap-planner.md`
15. `docs/runbooks/client-budget-roadmap-planner.md`
16. update `docs/API_ENDPOINT_INVENTORY.md` if present

## Database requirements

Create a focused migration with:

- primary tenant-scoped table `client_budget_roadmap_planner_records`
- indexes on `organization_id`, `status`, `risk_level`, `next_review_at` where applicable
- `created_at` / `updated_at`
- RLS enabled
- policies using the repo's canonical organization membership/permission helpers
- no seed data mixed into schema migration
- verification query additions where access behavior changes

Do not store raw passwords, secrets, API keys, or sensitive one-time codes. If the module needs evidence or secure artifacts, store references/metadata and use the existing document/file storage model.

## API requirements

Expose a predictable API shape where useful:

```text
GET    /api/v1/client-budget-roadmap-planner?organizationId=...
GET    /api/v1/client-budget-roadmap-planner/:id
POST   /api/v1/client-budget-roadmap-planner
PATCH  /api/v1/client-budget-roadmap-planner/:id
DELETE /api/v1/client-budget-roadmap-planner/:id
POST   /api/v1/client-budget-roadmap-planner/:id/approve
POST   /api/v1/client-budget-roadmap-planner/:id/publish
GET    /api/v1/client-budget-roadmap-planner/export.csv
```

Use:

- `requireAuth`
- `requireOrgAccess`
- Zod validators
- standard success/error response helpers
- service functions for nontrivial logic
- audit logging for create/update/delete/approve/publish/export
- permission checks where the repo already uses them

## SDK requirements

Create a typed SDK wrapper with at least:

- `list(params)`
- `get(id)`
- `create(data)`
- `update(id, data)`
- `remove(id)`
- `approve(id)` where applicable
- `publish(id)` where applicable
- `export(params)` where applicable

## Web UI requirements

Build portal UI with:

- page title and description
- organization-scoped list/table/cards
- search/filter controls
- create/edit form
- detail view or drawer
- empty state with clear CTA
- loading and error state
- badges for status/risk/visibility
- client-visible/publication indicators where useful
- export action if useful and permission-gated
- accessibility-minded labels and keyboard-friendly controls

## AI behavior requirements

If adding AI support:

- AI may draft summaries, explanations, recommendations, and report snippets.
- AI output must be stored as draft or pending review.
- Human approval is required before publishing, executing scripts, making destructive changes, changing DNS, removing licenses, completing offboarding, or notifying clients externally.
- Store prompt key/version and reviewer status where practical.

## Testing requirements

Add tests for:

- validation errors
- auth required
- organization access required
- successful list/create/update
- audit logging on mutation
- export permission check if applicable
- E2E smoke: portal page loads and empty/list state renders

## Documentation requirements

Feature doc should include:

- purpose
- permissions
- routes
- data model
- workflows
- AI review rules if any
- troubleshooting
- release checklist

Runbook should include:

- owner
- normal operation
- common failures
- verification steps
- escalation
- rollback notes

## Final response required from coding agent

Return:

- files changed
- migration/RLS summary
- endpoints added
- SDK methods added
- portal routes/components added
- tests added and commands run
- docs updated
- known limitations
- recommended next module
