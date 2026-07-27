# Deep Audit / Hardening Prompt: QBR Executive Report Generator

Audit the **QBR Executive Report Generator** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Monthly/quarterly executive reports summarizing tickets, risks, assets, projects, security, backups, and recommendations.
Primary users: MSP owner, client executive
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*qbr_executive_report_generator*.sql`
- `apps/api/src/routes/qbr-executive-report-generator.ts`
- `apps/api/src/validators/qbr-executive-report-generator.ts`
- `apps/api/src/services/qbr-executive-report-generator.ts`
- `packages/sdk/src/qbr-executive-report-generator.ts`
- `apps/web/app/(portal)/portal/qbr-executive-report-generator/**/*`
- `apps/web/components/portal/QbrExecutiveReportGenerator/**/*`
- `apps/worker/src/tasks/qbr-executive-report-generator.ts` if present
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
