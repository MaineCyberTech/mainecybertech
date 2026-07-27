# Deep Audit / Hardening Prompt: Hardware Staging Checklist Manager

Audit the **Hardware Staging Checklist Manager** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Pre-deployment staging checklist for laptops, firewalls, switches, APs, cameras, NVRs, printers, labels, photos, and handoff evidence.
Primary users: Technician, project lead
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*hardware_staging_checklist_manager*.sql`
- `apps/api/src/routes/hardware-staging-checklist-manager.ts`
- `apps/api/src/validators/hardware-staging-checklist-manager.ts`
- `apps/api/src/services/hardware-staging-checklist-manager.ts`
- `packages/sdk/src/hardware-staging-checklist-manager.ts`
- `apps/web/app/(portal)/portal/hardware-staging-checklist-manager/**/*`
- `apps/web/components/portal/HardwareStagingChecklistManager/**/*`
- `apps/worker/src/tasks/hardware-staging-checklist-manager.ts` if present
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
