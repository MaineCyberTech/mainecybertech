# Deep Audit / Hardening Prompt: Dynamic Client Forms Builder

Audit the **Dynamic Client Forms Builder** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: No-code form builder for client intake forms, onboarding questionnaires, site surveys, access requests, incident reports, and approval forms.
Primary users: MSP admin, client users
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*dynamic_client_forms_builder*.sql`
- `apps/api/src/routes/dynamic-client-forms-builder.ts`
- `apps/api/src/validators/dynamic-client-forms-builder.ts`
- `apps/api/src/services/dynamic-client-forms-builder.ts`
- `packages/sdk/src/dynamic-client-forms-builder.ts`
- `apps/web/app/(portal)/portal/dynamic-client-forms-builder/**/*`
- `apps/web/components/portal/DynamicClientFormsBuilder/**/*`
- `apps/worker/src/tasks/dynamic-client-forms-builder.ts` if present
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
