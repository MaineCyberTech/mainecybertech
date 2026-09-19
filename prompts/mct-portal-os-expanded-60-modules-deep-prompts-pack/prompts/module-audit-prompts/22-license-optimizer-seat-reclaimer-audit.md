# Deep Audit / Hardening Prompt: License Optimizer Seat Reclaimer

Audit the **License Optimizer Seat Reclaimer** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Tracks assigned vs used licenses, renewal costs, inactive users, unused seats, and reclaim recommendations.
Primary users: MSP admin, client finance/IT contact
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*license_optimizer_seat_reclaimer*.sql`
- `apps/api/src/routes/license-optimizer-seat-reclaimer.ts`
- `apps/api/src/validators/license-optimizer-seat-reclaimer.ts`
- `apps/api/src/services/license-optimizer-seat-reclaimer.ts`
- `packages/sdk/src/license-optimizer-seat-reclaimer.ts`
- `apps/web/app/(portal)/portal/license-optimizer-seat-reclaimer/**/*`
- `apps/web/components/portal/LicenseOptimizerSeatReclaimer/**/*`
- `apps/worker/src/tasks/license-optimizer-seat-reclaimer.ts` if present
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
