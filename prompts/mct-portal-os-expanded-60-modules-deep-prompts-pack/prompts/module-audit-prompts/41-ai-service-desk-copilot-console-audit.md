# Deep Audit / Hardening Prompt: AI Service Desk Copilot Console

Audit the **AI Service Desk Copilot Console** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Operator-facing AI console that summarizes tickets, drafts replies, recommends next troubleshooting questions, and links related KB/runbook content while preserving human approval.
Primary users: Service desk, technician, MSP owner
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*ai_service_desk_copilot_console*.sql`
- `apps/api/src/routes/ai-service-desk-copilot-console.ts`
- `apps/api/src/validators/ai-service-desk-copilot-console.ts`
- `apps/api/src/services/ai-service-desk-copilot-console.ts`
- `packages/sdk/src/ai-service-desk-copilot-console.ts`
- `apps/web/app/(portal)/portal/ai-service-desk-copilot-console/**/*`
- `apps/web/components/portal/AiServiceDeskCopilotConsole/**/*`
- `apps/worker/src/tasks/ai-service-desk-copilot-console.ts` if present
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
