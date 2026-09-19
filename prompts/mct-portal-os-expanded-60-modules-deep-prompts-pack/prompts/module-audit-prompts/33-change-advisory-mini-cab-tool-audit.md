# Deep Audit / Hardening Prompt: Change Advisory Mini-CAB Tool

Audit the **Change Advisory Mini-CAB Tool** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Lightweight change request, risk, approval, implementation, verification, and rollback tracker for small MSP environments.
Primary users: MSP owner, technician, client approver
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*change_advisory_mini_cab_tool*.sql`
- `apps/api/src/routes/change-advisory-mini-cab-tool.ts`
- `apps/api/src/validators/change-advisory-mini-cab-tool.ts`
- `apps/api/src/services/change-advisory-mini-cab-tool.ts`
- `packages/sdk/src/change-advisory-mini-cab-tool.ts`
- `apps/web/app/(portal)/portal/change-advisory-mini-cab-tool/**/*`
- `apps/web/components/portal/ChangeAdvisoryMiniCabTool/**/*`
- `apps/worker/src/tasks/change-advisory-mini-cab-tool.ts` if present
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
