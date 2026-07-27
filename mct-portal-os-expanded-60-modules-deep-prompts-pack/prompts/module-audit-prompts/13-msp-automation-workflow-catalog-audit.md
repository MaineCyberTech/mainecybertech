# Deep Audit / Hardening Prompt: MSP Automation Workflow Catalog

Audit the **MSP Automation Workflow Catalog** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Catalog, document, approve, and execute repeatable scripts/workflows with logs and rollback notes.
Primary users: MSP admin, automation engineer
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*msp_automation_workflow_catalog*.sql`
- `apps/api/src/routes/msp-automation-workflow-catalog.ts`
- `apps/api/src/validators/msp-automation-workflow-catalog.ts`
- `apps/api/src/services/msp-automation-workflow-catalog.ts`
- `packages/sdk/src/msp-automation-workflow-catalog.ts`
- `apps/web/app/(portal)/portal/msp-automation-workflow-catalog/**/*`
- `apps/web/components/portal/MspAutomationWorkflowCatalog/**/*`
- `apps/worker/src/tasks/msp-automation-workflow-catalog.ts` if present
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
