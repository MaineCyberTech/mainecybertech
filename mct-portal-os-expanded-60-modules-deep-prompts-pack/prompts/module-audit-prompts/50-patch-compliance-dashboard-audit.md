# Deep Audit / Hardening Prompt: Patch Compliance Dashboard

Audit the **Patch Compliance Dashboard** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Tracks patch status, device groups, missing updates, maintenance windows, exception approvals, and reporting evidence.
Primary users: MSP admin, security lead
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*patch_compliance_dashboard*.sql`
- `apps/api/src/routes/patch-compliance-dashboard.ts`
- `apps/api/src/validators/patch-compliance-dashboard.ts`
- `apps/api/src/services/patch-compliance-dashboard.ts`
- `packages/sdk/src/patch-compliance-dashboard.ts`
- `apps/web/app/(portal)/portal/patch-compliance-dashboard/**/*`
- `apps/web/components/portal/PatchComplianceDashboard/**/*`
- `apps/worker/src/tasks/patch-compliance-dashboard.ts` if present
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
