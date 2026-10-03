# Deep Audit / Hardening Prompt: Emergency Access Break Glass Register

Audit the **Emergency Access Break Glass Register** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Tracks break-glass accounts, custody, review dates, emergency access procedures, testing, and evidence without storing raw secrets.
Primary users: MSP owner, security lead
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*emergency_access_break_glass_register*.sql`
- `apps/api/src/routes/emergency-access-break-glass-register.ts`
- `apps/api/src/validators/emergency-access-break-glass-register.ts`
- `apps/api/src/services/emergency-access-break-glass-register.ts`
- `packages/sdk/src/emergency-access-break-glass-register.ts`
- `apps/web/app/(portal)/portal/emergency-access-break-glass-register/**/*`
- `apps/web/components/portal/EmergencyAccessBreakGlassRegister/**/*`
- `apps/worker/src/tasks/emergency-access-break-glass-register.ts` if present
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
