# Deep Audit / Hardening Prompt: Compliance Readiness Lite for Small Businesses

Audit the **Compliance Readiness Lite for Small Businesses** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Questionnaires, control checklists, evidence, risk register, policy library, and client-friendly readiness reports.
Primary users: MSP advisor, business owner
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*compliance_readiness_lite_for_small_businesses*.sql`
- `apps/api/src/routes/compliance-readiness-lite-for-small-businesses.ts`
- `apps/api/src/validators/compliance-readiness-lite-for-small-businesses.ts`
- `apps/api/src/services/compliance-readiness-lite-for-small-businesses.ts`
- `packages/sdk/src/compliance-readiness-lite-for-small-businesses.ts`
- `apps/web/app/(portal)/portal/compliance-readiness-lite-for-small-businesses/**/*`
- `apps/web/components/portal/ComplianceReadinessLiteForSmallBusinesses/**/*`
- `apps/worker/src/tasks/compliance-readiness-lite-for-small-businesses.ts` if present
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
