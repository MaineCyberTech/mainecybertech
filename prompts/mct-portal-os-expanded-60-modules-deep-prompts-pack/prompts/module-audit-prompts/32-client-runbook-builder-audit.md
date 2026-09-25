# Deep Audit / Hardening Prompt: Client Runbook Builder

Audit the **Client Runbook Builder** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Creates client-specific support runbooks from SOP templates, asset data, contacts, vendors, escalation rules, and known issues.
Primary users: MSP admin, technician
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*client_runbook_builder*.sql`
- `apps/api/src/routes/client-runbook-builder.ts`
- `apps/api/src/validators/client-runbook-builder.ts`
- `apps/api/src/services/client-runbook-builder.ts`
- `packages/sdk/src/client-runbook-builder.ts`
- `apps/web/app/(portal)/portal/client-runbook-builder/**/*`
- `apps/web/components/portal/ClientRunbookBuilder/**/*`
- `apps/worker/src/tasks/client-runbook-builder.ts` if present
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
| -------- | ------- | -------------- | ------------- | --- | --------------- |

Then provide:

- top 5 recommended fixes
- patch order
- missing tests
- documentation gaps
- release readiness verdict
