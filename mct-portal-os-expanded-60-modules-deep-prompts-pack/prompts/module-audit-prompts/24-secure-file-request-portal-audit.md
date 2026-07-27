# Deep Audit / Hardening Prompt: Secure File Request Portal

Audit the **Secure File Request Portal** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: One-time or scoped file request links for clients to upload bills, floor plans, exports, logs, photos, and evidence securely.
Primary users: MSP admin, client user
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*secure_file_request_portal*.sql`
- `apps/api/src/routes/secure-file-request-portal.ts`
- `apps/api/src/validators/secure-file-request-portal.ts`
- `apps/api/src/services/secure-file-request-portal.ts`
- `packages/sdk/src/secure-file-request-portal.ts`
- `apps/web/app/(portal)/portal/secure-file-request-portal/**/*`
- `apps/web/components/portal/SecureFileRequestPortal/**/*`
- `apps/worker/src/tasks/secure-file-request-portal.ts` if present
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
