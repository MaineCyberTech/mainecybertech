# Deep Build Prompt: Fun Cyber Scoreboard Mascot

You are implementing **Fun Cyber Scoreboard Mascot** in the existing MaineCyberTech portal/OS monorepo.

## Product intent

Gamified client security dashboard with badges, progress bars, mascot-style encouragement, and cyber hygiene goals.

Primary users: Client users, MSP advisor
Category: fun-client-engagement
Business impact: Medium
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

1. `supabase/migrations/<timestamp>_fun_cyber_scoreboard_mascot.sql`
2. `apps/api/src/validators/fun-cyber-scoreboard-mascot.ts`
3. `apps/api/src/services/fun-cyber-scoreboard-mascot.ts`
4. `apps/api/src/routes/fun-cyber-scoreboard-mascot.ts`
5. register the route in `apps/api/src/app.ts`
6. `packages/sdk/src/fun-cyber-scoreboard-mascot.ts`
7. export SDK module from `packages/sdk/src/index.ts`
8. `apps/web/app/(portal)/portal/fun-cyber-scoreboard-mascot/page.tsx`
9. `apps/web/app/(portal)/portal/fun-cyber-scoreboard-mascot/[id]/page.tsx` if detail route is useful
10. `apps/web/components/portal/FunCyberScoreboardMascot/` components
11. `apps/worker/src/tasks/fun-cyber-scoreboard-mascot.ts` if components include worker
12. `apps/api/src/__tests__/fun-cyber-scoreboard-mascot.test.ts`
13. `apps/web/e2e/portal/fun-cyber-scoreboard-mascot.spec.ts`
14. `docs/features/fun-cyber-scoreboard-mascot.md`
15. `docs/runbooks/fun-cyber-scoreboard-mascot.md`
16. update `docs/API_ENDPOINT_INVENTORY.md` if present

## Database requirements

Create a focused migration with:

- primary tenant-scoped table `fun_cyber_scoreboard_mascot_records`
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
GET    /api/v1/fun-cyber-scoreboard-mascot?organizationId=...
GET    /api/v1/fun-cyber-scoreboard-mascot/:id
POST   /api/v1/fun-cyber-scoreboard-mascot
PATCH  /api/v1/fun-cyber-scoreboard-mascot/:id
DELETE /api/v1/fun-cyber-scoreboard-mascot/:id
POST   /api/v1/fun-cyber-scoreboard-mascot/:id/approve
POST   /api/v1/fun-cyber-scoreboard-mascot/:id/publish
GET    /api/v1/fun-cyber-scoreboard-mascot/export.csv
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
