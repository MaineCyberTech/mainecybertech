# Deep Audit / Hardening Prompt: Vendor SaaS Subscription Audit Portal

Audit the **Vendor SaaS Subscription Audit Portal** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Import bank/card exports, detect recurring SaaS/vendors, classify spend, and identify cancellation/security risks.
Primary users: MSP owner, client finance contact
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*vendor_saas_subscription_audit_portal*.sql`
- `apps/api/src/routes/vendor-saas-subscription-audit-portal.ts`
- `apps/api/src/validators/vendor-saas-subscription-audit-portal.ts`
- `apps/api/src/services/vendor-saas-subscription-audit-portal.ts`
- `packages/sdk/src/vendor-saas-subscription-audit-portal.ts`
- `apps/web/app/(portal)/portal/vendor-saas-subscription-audit-portal/**/*`
- `apps/web/components/portal/VendorSaasSubscriptionAuditPortal/**/*`
- `apps/worker/src/tasks/vendor-saas-subscription-audit-portal.ts` if present
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
