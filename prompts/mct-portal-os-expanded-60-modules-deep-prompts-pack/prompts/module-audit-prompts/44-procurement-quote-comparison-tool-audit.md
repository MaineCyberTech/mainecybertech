# Deep Audit / Hardening Prompt: Procurement Quote Comparison Tool

Audit the **Procurement Quote Comparison Tool** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Compare hardware/software/vendor quotes, options, margins, warranty terms, deployment notes, and recommendation rationale.
Primary users: MSP owner, client buyer
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*procurement_quote_comparison_tool*.sql`
- `apps/api/src/routes/procurement-quote-comparison-tool.ts`
- `apps/api/src/validators/procurement-quote-comparison-tool.ts`
- `apps/api/src/services/procurement-quote-comparison-tool.ts`
- `packages/sdk/src/procurement-quote-comparison-tool.ts`
- `apps/web/app/(portal)/portal/procurement-quote-comparison-tool/**/*`
- `apps/web/components/portal/ProcurementQuoteComparisonTool/**/*`
- `apps/worker/src/tasks/procurement-quote-comparison-tool.ts` if present
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
