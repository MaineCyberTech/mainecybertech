# Deep Audit / Hardening Prompt: Approval Workflow Engine

Audit the **Approval Workflow Engine** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Reusable approval system for proposals, change requests, file requests, privileged service desk actions, budget items, procurement, and client sign-offs.
Primary users: MSP admin, client approvers
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*approval_workflow_engine*.sql`
- `apps/api/src/routes/approval-workflow-engine.ts`
- `apps/api/src/validators/approval-workflow-engine.ts`
- `apps/api/src/services/approval-workflow-engine.ts`
- `packages/sdk/src/approval-workflow-engine.ts`
- `apps/web/app/(portal)/portal/approval-workflow-engine/**/*`
- `apps/web/components/portal/ApprovalWorkflowEngine/**/*`
- `apps/worker/src/tasks/approval-workflow-engine.ts` if present
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
