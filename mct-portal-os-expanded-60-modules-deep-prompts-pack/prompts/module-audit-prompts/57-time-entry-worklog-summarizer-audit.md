# Deep Audit / Hardening Prompt: Time Entry Worklog Summarizer

Audit the **Time Entry Worklog Summarizer** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Summarizes technician worklogs into client-friendly updates, QBR value statements, billing narratives, and internal lessons learned.
Primary users: MSP owner, technician
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*time_entry_worklog_summarizer*.sql`
- `apps/api/src/routes/time-entry-worklog-summarizer.ts`
- `apps/api/src/validators/time-entry-worklog-summarizer.ts`
- `apps/api/src/services/time-entry-worklog-summarizer.ts`
- `packages/sdk/src/time-entry-worklog-summarizer.ts`
- `apps/web/app/(portal)/portal/time-entry-worklog-summarizer/**/*`
- `apps/web/components/portal/TimeEntryWorklogSummarizer/**/*`
- `apps/worker/src/tasks/time-entry-worklog-summarizer.ts` if present
- tests, docs, runbook, API inventory

## Audit categories

1. Tenant isolation and RLS
2. Organization access enforcement
3. Role/permission gating
4. Input validation and output shape
5. Audit logging and timeline events
6. Export/publication safety
7. AI approval gates and draft handling
8. Worker idempotency/retry safety
9. Error handling and observability
10. UI empty/loading/error states
11. Accessibility and responsiveness
12. SDK/API consistency
13. Tests and E2E coverage
14. Documentation/runbook completeness
15. Migration/seed/verification hygiene

## Output format

Return a P0/P1/P2/P3 remediation matrix:

| Severity | Finding | Impacted files | Risk scenario | Fix | Acceptance test |
|---|---|---|---|---|---|

Then provide:

- top 5 recommended fixes
- patch order
- missing tests
- documentation gaps
- release readiness verdict
