# Deep Audit / Hardening Prompt: Endpoint Security Coverage Map

Audit the **Endpoint Security Coverage Map** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Maps clients/devices to endpoint protection, disk encryption, MDM enrollment, local admin status, firewall, and monitoring coverage.
Primary users: MSP security lead, client IT owner
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*endpoint_security_coverage_map*.sql`
- `apps/api/src/routes/endpoint-security-coverage-map.ts`
- `apps/api/src/validators/endpoint-security-coverage-map.ts`
- `apps/api/src/services/endpoint-security-coverage-map.ts`
- `packages/sdk/src/endpoint-security-coverage-map.ts`
- `apps/web/app/(portal)/portal/endpoint-security-coverage-map/**/*`
- `apps/web/components/portal/EndpointSecurityCoverageMap/**/*`
- `apps/worker/src/tasks/endpoint-security-coverage-map.ts` if present
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
