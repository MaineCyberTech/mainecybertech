# Deep Audit / Hardening Prompt: Network Port Map Patch Panel Tracker

Audit the **Network Port Map Patch Panel Tracker** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Documents switches, ports, VLANs, patch panels, wall jacks, uplinks, and connected devices.
Primary users: Network tech, client IT contact
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*network_port_map_patch_panel_tracker*.sql`
- `apps/api/src/routes/network-port-map-patch-panel-tracker.ts`
- `apps/api/src/validators/network-port-map-patch-panel-tracker.ts`
- `apps/api/src/services/network-port-map-patch-panel-tracker.ts`
- `packages/sdk/src/network-port-map-patch-panel-tracker.ts`
- `apps/web/app/(portal)/portal/network-port-map-patch-panel-tracker/**/*`
- `apps/web/components/portal/NetworkPortMapPatchPanelTracker/**/*`
- `apps/worker/src/tasks/network-port-map-patch-panel-tracker.ts` if present
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
