# Deep Audit / Hardening Prompt: Small Business AI Policy Assistant

Audit the **Small Business AI Policy Assistant** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Helps clients draft basic AI use policies, approved tools lists, data handling rules, and employee guidance.
Primary users: MSP advisor, client leadership
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*small_business_ai_policy_assistant*.sql`
- `apps/api/src/routes/small-business-ai-policy-assistant.ts`
- `apps/api/src/validators/small-business-ai-policy-assistant.ts`
- `apps/api/src/services/small-business-ai-policy-assistant.ts`
- `packages/sdk/src/small-business-ai-policy-assistant.ts`
- `apps/web/app/(portal)/portal/small-business-ai-policy-assistant/**/*`
- `apps/web/components/portal/SmallBusinessAiPolicyAssistant/**/*`
- `apps/worker/src/tasks/small-business-ai-policy-assistant.ts` if present
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
