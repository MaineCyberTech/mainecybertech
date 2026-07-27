# Deep Audit / Hardening Prompt: Email Deliverability DMARC Coach

Audit the **Email Deliverability DMARC Coach** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Guided SPF/DKIM/DMARC checks, policy status, alignment notes, and client-friendly remediation recommendations.
Primary users: MSP admin, domain owner
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*email_deliverability_dmarc_coach*.sql`
- `apps/api/src/routes/email-deliverability-dmarc-coach.ts`
- `apps/api/src/validators/email-deliverability-dmarc-coach.ts`
- `apps/api/src/services/email-deliverability-dmarc-coach.ts`
- `packages/sdk/src/email-deliverability-dmarc-coach.ts`
- `apps/web/app/(portal)/portal/email-deliverability-dmarc-coach/**/*`
- `apps/web/components/portal/EmailDeliverabilityDmarcCoach/**/*`
- `apps/worker/src/tasks/email-deliverability-dmarc-coach.ts` if present
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
