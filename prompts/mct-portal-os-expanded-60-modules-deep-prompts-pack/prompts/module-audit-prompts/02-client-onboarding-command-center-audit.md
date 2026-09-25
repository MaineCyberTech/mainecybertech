# Deep Audit / Hardening Prompt: Client Onboarding Command Center

Audit the **Client Onboarding Command Center** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Repeatable workspace for client discovery, M365 setup, access collection, network baseline, documentation, security baseline, and support handoff.
Primary users: MSP onboarding lead, client sponsor, technician
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*client_onboarding_command_center*.sql`
- `apps/api/src/routes/client-onboarding-command-center.ts`
- `apps/api/src/validators/client-onboarding-command-center.ts`
- `apps/api/src/services/client-onboarding-command-center.ts`
- `packages/sdk/src/client-onboarding-command-center.ts`
- `apps/web/app/(portal)/portal/client-onboarding-command-center/**/*`
- `apps/web/components/portal/ClientOnboardingCommandCenter/**/*`
- `apps/worker/src/tasks/client-onboarding-command-center.ts` if present
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
