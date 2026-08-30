# Deep Audit / Hardening Prompt: Multi-Tenant MSP Client Portal

Audit the **Multi-Tenant MSP Client Portal** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Foundation portal for tickets, approvals, reports, documents, contacts, assets, roadmaps, service health, and client self-service.
Primary users: Client owners, internal MSP admins, client admins, technicians
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*multi_tenant_msp_client_portal*.sql`
- `apps/api/src/routes/multi-tenant-msp-client-portal.ts`
- `apps/api/src/validators/multi-tenant-msp-client-portal.ts`
- `apps/api/src/services/multi-tenant-msp-client-portal.ts`
- `packages/sdk/src/multi-tenant-msp-client-portal.ts`
- `apps/web/app/(portal)/portal/multi-tenant-msp-client-portal/**/*`
- `apps/web/components/portal/MultiTenantMspClientPortal/**/*`
- `apps/worker/src/tasks/multi-tenant-msp-client-portal.ts` if present
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
