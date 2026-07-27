# Deep Audit / Hardening Prompt: ISP Phone Network Consolidation Assessment

Audit the **ISP Phone Network Consolidation Assessment** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Bill/service intake and recommendation tool for ISP, phone, VoIP, Wi-Fi, and telecom consolidation projects.
Primary users: Sales engineer, client office manager, project lead
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*isp_phone_network_consolidation_assessment*.sql`
- `apps/api/src/routes/isp-phone-network-consolidation-assessment.ts`
- `apps/api/src/validators/isp-phone-network-consolidation-assessment.ts`
- `apps/api/src/services/isp-phone-network-consolidation-assessment.ts`
- `packages/sdk/src/isp-phone-network-consolidation-assessment.ts`
- `apps/web/app/(portal)/portal/isp-phone-network-consolidation-assessment/**/*`
- `apps/web/components/portal/IspPhoneNetworkConsolidationAssessment/**/*`
- `apps/worker/src/tasks/isp-phone-network-consolidation-assessment.ts` if present
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
