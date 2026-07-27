# Deep Audit / Hardening Prompt: Phishing Simulation Lite

Audit the **Phishing Simulation Lite** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Creates simple internal phishing awareness exercises, tracks completion, and produces coaching/reporting outputs.
Primary users: Training admin, MSP security lead
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*phishing_simulation_lite*.sql`
- `apps/api/src/routes/phishing-simulation-lite.ts`
- `apps/api/src/validators/phishing-simulation-lite.ts`
- `apps/api/src/services/phishing-simulation-lite.ts`
- `packages/sdk/src/phishing-simulation-lite.ts`
- `apps/web/app/(portal)/portal/phishing-simulation-lite/**/*`
- `apps/web/components/portal/PhishingSimulationLite/**/*`
- `apps/worker/src/tasks/phishing-simulation-lite.ts` if present
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
