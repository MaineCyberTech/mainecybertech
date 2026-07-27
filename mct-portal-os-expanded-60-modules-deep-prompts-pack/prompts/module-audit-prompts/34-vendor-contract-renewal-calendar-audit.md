# Deep Audit / Hardening Prompt: Vendor Contract Renewal Calendar

Audit the **Vendor Contract Renewal Calendar** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Tracks vendor contracts, client service renewals, domains, certificates, warranties, insurance, and agreement dates.
Primary users: MSP owner, client finance contact
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*vendor_contract_renewal_calendar*.sql`
- `apps/api/src/routes/vendor-contract-renewal-calendar.ts`
- `apps/api/src/validators/vendor-contract-renewal-calendar.ts`
- `apps/api/src/services/vendor-contract-renewal-calendar.ts`
- `packages/sdk/src/vendor-contract-renewal-calendar.ts`
- `apps/web/app/(portal)/portal/vendor-contract-renewal-calendar/**/*`
- `apps/web/components/portal/VendorContractRenewalCalendar/**/*`
- `apps/worker/src/tasks/vendor-contract-renewal-calendar.ts` if present
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
