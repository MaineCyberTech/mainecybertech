# Deep Audit / Hardening Prompt: Open Findings Audit Remediation Tracker

Audit the **Open Findings Audit Remediation Tracker** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: P0/P1/P2/P3 finding lifecycle for repo, security, network, SOP, and client assessments.
Primary users: MSP owner, remediation owner, auditor
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*open_findings_audit_remediation_tracker*.sql`
- `apps/api/src/routes/open-findings-audit-remediation-tracker.ts`
- `apps/api/src/validators/open-findings-audit-remediation-tracker.ts`
- `apps/api/src/services/open-findings-audit-remediation-tracker.ts`
- `packages/sdk/src/open-findings-audit-remediation-tracker.ts`
- `apps/web/app/(portal)/portal/open-findings-audit-remediation-tracker/**/*`
- `apps/web/components/portal/OpenFindingsAuditRemediationTracker/**/*`
- `apps/worker/src/tasks/open-findings-audit-remediation-tracker.ts` if present
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
