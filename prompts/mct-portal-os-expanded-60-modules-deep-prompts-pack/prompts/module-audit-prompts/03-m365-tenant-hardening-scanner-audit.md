# Deep Audit / Hardening Prompt: M365 Tenant Hardening Scanner

Audit the **M365 Tenant Hardening Scanner** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Guided and eventually automated Microsoft 365 security baseline review with remediation tasks, evidence tracking, and recurring drift review.
Primary users: Security admin, MSP admin, client technical contact
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*m365_tenant_hardening_scanner*.sql`
- `apps/api/src/routes/m365-tenant-hardening-scanner.ts`
- `apps/api/src/validators/m365-tenant-hardening-scanner.ts`
- `apps/api/src/services/m365-tenant-hardening-scanner.ts`
- `packages/sdk/src/m365-tenant-hardening-scanner.ts`
- `apps/web/app/(portal)/portal/m365-tenant-hardening-scanner/**/*`
- `apps/web/components/portal/M365TenantHardeningScanner/**/*`
- `apps/worker/src/tasks/m365-tenant-hardening-scanner.ts` if present
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
