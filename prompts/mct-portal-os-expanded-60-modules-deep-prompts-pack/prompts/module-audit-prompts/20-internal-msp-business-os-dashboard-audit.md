# Deep Audit / Hardening Prompt: Internal MSP Business OS Dashboard

Audit the **Internal MSP Business OS Dashboard** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Private operating dashboard for clients, proposals, projects, revenue, renewals, SOP reviews, vendors, tasks, and compliance reminders.
Primary users: MSP owner, operations lead
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*internal_msp_business_os_dashboard*.sql`
- `apps/api/src/routes/internal-msp-business-os-dashboard.ts`
- `apps/api/src/validators/internal-msp-business-os-dashboard.ts`
- `apps/api/src/services/internal-msp-business-os-dashboard.ts`
- `packages/sdk/src/internal-msp-business-os-dashboard.ts`
- `apps/web/app/(portal)/portal/internal-msp-business-os-dashboard/**/*`
- `apps/web/components/portal/InternalMspBusinessOsDashboard/**/*`
- `apps/worker/src/tasks/internal-msp-business-os-dashboard.ts` if present
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
