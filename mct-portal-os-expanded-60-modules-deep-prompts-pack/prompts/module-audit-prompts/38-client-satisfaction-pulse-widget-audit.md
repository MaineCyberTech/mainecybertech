# Deep Audit / Hardening Prompt: Client Satisfaction Pulse Widget

Audit the **Client Satisfaction Pulse Widget** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Quick CSAT/NPS-style pulse surveys tied to tickets, projects, QBRs, onboarding milestones, and follow-ups.
Primary users: Client success lead, MSP owner
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*client_satisfaction_pulse_widget*.sql`
- `apps/api/src/routes/client-satisfaction-pulse-widget.ts`
- `apps/api/src/validators/client-satisfaction-pulse-widget.ts`
- `apps/api/src/services/client-satisfaction-pulse-widget.ts`
- `packages/sdk/src/client-satisfaction-pulse-widget.ts`
- `apps/web/app/(portal)/portal/client-satisfaction-pulse-widget/**/*`
- `apps/web/components/portal/ClientSatisfactionPulseWidget/**/*`
- `apps/worker/src/tasks/client-satisfaction-pulse-widget.ts` if present
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
