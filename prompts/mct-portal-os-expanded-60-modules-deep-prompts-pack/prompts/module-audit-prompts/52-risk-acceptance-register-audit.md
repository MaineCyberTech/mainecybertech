# Deep Audit / Hardening Prompt: Risk Acceptance Register

Audit the **Risk Acceptance Register** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Tracks known risks accepted by clients/internal stakeholders, acceptance owner, expiration, review cadence, compensating controls, and evidence.
Primary users: MSP owner, client executive
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*risk_acceptance_register*.sql`
- `apps/api/src/routes/risk-acceptance-register.ts`
- `apps/api/src/validators/risk-acceptance-register.ts`
- `apps/api/src/services/risk-acceptance-register.ts`
- `packages/sdk/src/risk-acceptance-register.ts`
- `apps/web/app/(portal)/portal/risk-acceptance-register/**/*`
- `apps/web/components/portal/RiskAcceptanceRegister/**/*`
- `apps/worker/src/tasks/risk-acceptance-register.ts` if present
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
