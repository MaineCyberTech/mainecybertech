# Deep Audit / Hardening Prompt: Client Billing Service Catalog

Audit the **Client Billing Service Catalog** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Defines recurring services, billable items, included/excluded scope, pricing tiers, bundled services, and client-specific subscriptions.
Primary users: MSP owner, client finance contact
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*client_billing_service_catalog*.sql`
- `apps/api/src/routes/client-billing-service-catalog.ts`
- `apps/api/src/validators/client-billing-service-catalog.ts`
- `apps/api/src/services/client-billing-service-catalog.ts`
- `packages/sdk/src/client-billing-service-catalog.ts`
- `apps/web/app/(portal)/portal/client-billing-service-catalog/**/*`
- `apps/web/components/portal/ClientBillingServiceCatalog/**/*`
- `apps/worker/src/tasks/client-billing-service-catalog.ts` if present
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
