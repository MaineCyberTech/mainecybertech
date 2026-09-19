# Deep Audit / Hardening Prompt: Device Configuration Profile Library

Audit the **Device Configuration Profile Library** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Reusable configuration profiles for M365, Windows 11, baseline settings, browser settings, VPN notes, UniFi device standards, and deployment templates.
Primary users: MSP admin, endpoint technician
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*device_configuration_profile_library*.sql`
- `apps/api/src/routes/device-configuration-profile-library.ts`
- `apps/api/src/validators/device-configuration-profile-library.ts`
- `apps/api/src/services/device-configuration-profile-library.ts`
- `packages/sdk/src/device-configuration-profile-library.ts`
- `apps/web/app/(portal)/portal/device-configuration-profile-library/**/*`
- `apps/web/components/portal/DeviceConfigurationProfileLibrary/**/*`
- `apps/worker/src/tasks/device-configuration-profile-library.ts` if present
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
