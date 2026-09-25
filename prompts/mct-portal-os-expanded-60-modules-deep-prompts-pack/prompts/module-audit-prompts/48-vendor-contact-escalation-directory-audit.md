# Deep Audit / Hardening Prompt: Vendor Contact Escalation Directory

Audit the **Vendor Contact Escalation Directory** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Centralized vendor directory with contacts, support portals, account IDs, escalation paths, contract notes, and client-specific ownership.
Primary users: MSP admin, technician
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*vendor_contact_escalation_directory*.sql`
- `apps/api/src/routes/vendor-contact-escalation-directory.ts`
- `apps/api/src/validators/vendor-contact-escalation-directory.ts`
- `apps/api/src/services/vendor-contact-escalation-directory.ts`
- `packages/sdk/src/vendor-contact-escalation-directory.ts`
- `apps/web/app/(portal)/portal/vendor-contact-escalation-directory/**/*`
- `apps/web/components/portal/VendorContactEscalationDirectory/**/*`
- `apps/worker/src/tasks/vendor-contact-escalation-directory.ts` if present
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
