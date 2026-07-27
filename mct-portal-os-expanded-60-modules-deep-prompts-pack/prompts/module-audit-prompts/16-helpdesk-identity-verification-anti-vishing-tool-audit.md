# Deep Audit / Hardening Prompt: Helpdesk Identity Verification Anti-Vishing Tool

Audit the **Helpdesk Identity Verification Anti-Vishing Tool** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Verify requestors and technicians before privileged actions such as MFA reset, password reset, remote access, or vendor/billing changes.
Primary users: Service desk, client authorized contacts
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*helpdesk_identity_verification_anti_vishing_tool*.sql`
- `apps/api/src/routes/helpdesk-identity-verification-anti-vishing-tool.ts`
- `apps/api/src/validators/helpdesk-identity-verification-anti-vishing-tool.ts`
- `apps/api/src/services/helpdesk-identity-verification-anti-vishing-tool.ts`
- `packages/sdk/src/helpdesk-identity-verification-anti-vishing-tool.ts`
- `apps/web/app/(portal)/portal/helpdesk-identity-verification-anti-vishing-tool/**/*`
- `apps/web/components/portal/HelpdeskIdentityVerificationAntiVishingTool/**/*`
- `apps/worker/src/tasks/helpdesk-identity-verification-anti-vishing-tool.ts` if present
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
