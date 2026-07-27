# Deep Audit / Hardening Prompt: Public Status Page Maintenance Notices

Audit the **Public Status Page Maintenance Notices** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Public/private status pages for client services, scheduled maintenance, incidents, and post-incident updates.
Primary users: MSP admin, client users
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*public_status_page_maintenance_notices*.sql`
- `apps/api/src/routes/public-status-page-maintenance-notices.ts`
- `apps/api/src/validators/public-status-page-maintenance-notices.ts`
- `apps/api/src/services/public-status-page-maintenance-notices.ts`
- `packages/sdk/src/public-status-page-maintenance-notices.ts`
- `apps/web/app/(portal)/portal/public-status-page-maintenance-notices/**/*`
- `apps/web/components/portal/PublicStatusPageMaintenanceNotices/**/*`
- `apps/worker/src/tasks/public-status-page-maintenance-notices.ts` if present
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
