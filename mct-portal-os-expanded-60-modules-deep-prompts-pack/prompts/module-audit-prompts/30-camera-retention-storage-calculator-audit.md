# Deep Audit / Hardening Prompt: Camera Retention Storage Calculator

Audit the **Camera Retention Storage Calculator** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Calculates estimated NVR/storage requirements from camera count, bitrate, resolution, and retention goals.
Primary users: Field tech, client stakeholder
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*camera_retention_storage_calculator*.sql`
- `apps/api/src/routes/camera-retention-storage-calculator.ts`
- `apps/api/src/validators/camera-retention-storage-calculator.ts`
- `apps/api/src/services/camera-retention-storage-calculator.ts`
- `packages/sdk/src/camera-retention-storage-calculator.ts`
- `apps/web/app/(portal)/portal/camera-retention-storage-calculator/**/*`
- `apps/web/components/portal/CameraRetentionStorageCalculator/**/*`
- `apps/worker/src/tasks/camera-retention-storage-calculator.ts` if present
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
