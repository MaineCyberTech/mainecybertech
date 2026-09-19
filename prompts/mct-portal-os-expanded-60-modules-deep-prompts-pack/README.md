# MCT Portal/OS Expanded 60 Modules Deep Prompts Pack

Generated: 2026-07-25 22:05 UTC

This pack expands the prior 40-module roadmap into **60 modules** and significantly deepens each module spec and prompt. It is mapped to your current MaineCyberTech portal/OS repo structure from the attached Repomix snapshot.

## What is included

- **60 detailed module specs** in `docs/module-specs/`
- **60 detailed build prompts** in `prompts/module-prompts/`
- **60 audit/hardening prompts** in `prompts/module-audit-prompts/`
- **10 phase prompts** in `prompts/phase-prompts/`
- expanded implementation matrix and backlog CSV files
- repo-aligned templates for API, validators, SDK, portal pages, worker tasks, migrations, E2E tests, feature docs, and runbooks

## Repo implementation anchors

- API routes: `apps/api/src/routes/`
- Validators: `apps/api/src/validators/`
- Services: `apps/api/src/services/`
- API registration: `apps/api/src/app.ts`
- Portal pages: `apps/web/app/(portal)/portal/`
- Admin pages: `apps/web/app/(admin)/admin/`
- Components: `apps/web/components/portal/` and `apps/web/components/admin/`
- SDK: `packages/sdk/src/`
- Worker tasks: `apps/worker/src/tasks/`
- Supabase migrations: `supabase/migrations/`
- Tests: `apps/api/src/__tests__/`, `apps/web/e2e/portal/`

## Suggested execution approach

Use `prompts/MASTER_AGENT_PROMPT.md` first, then implement one module at a time using the corresponding prompt in `prompts/module-prompts/`.
