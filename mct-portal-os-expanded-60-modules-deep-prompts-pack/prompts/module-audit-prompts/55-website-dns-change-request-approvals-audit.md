# Deep Audit / Hardening Prompt: Website DNS Change Request Approvals

Audit the **Website DNS Change Request Approvals** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Structured approval and implementation tracker for DNS, Cloudflare, website, SSL, redirect, and hosting changes.
Primary users: MSP admin, client approver
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*website_dns_change_request_approvals*.sql`
- `apps/api/src/routes/website-dns-change-request-approvals.ts`
- `apps/api/src/validators/website-dns-change-request-approvals.ts`
- `apps/api/src/services/website-dns-change-request-approvals.ts`
- `packages/sdk/src/website-dns-change-request-approvals.ts`
- `apps/web/app/(portal)/portal/website-dns-change-request-approvals/**/*`
- `apps/web/components/portal/WebsiteDnsChangeRequestApprovals/**/*`
- `apps/worker/src/tasks/website-dns-change-request-approvals.ts` if present
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
