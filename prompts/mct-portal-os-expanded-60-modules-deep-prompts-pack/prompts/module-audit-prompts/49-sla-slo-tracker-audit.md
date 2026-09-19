# Deep Audit / Hardening Prompt: SLA SLO Tracker

Audit the **SLA SLO Tracker** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Tracks service targets, response/resolution commitments, breach risk, client-specific SLAs, internal SLOs, and reporting outputs.
Primary users: MSP owner, service manager
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*sla_slo_tracker*.sql`
- `apps/api/src/routes/sla-slo-tracker.ts`
- `apps/api/src/validators/sla-slo-tracker.ts`
- `apps/api/src/services/sla-slo-tracker.ts`
- `packages/sdk/src/sla-slo-tracker.ts`
- `apps/web/app/(portal)/portal/sla-slo-tracker/**/*`
- `apps/web/components/portal/SlaSloTracker/**/*`
- `apps/worker/src/tasks/sla-slo-tracker.ts` if present
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
