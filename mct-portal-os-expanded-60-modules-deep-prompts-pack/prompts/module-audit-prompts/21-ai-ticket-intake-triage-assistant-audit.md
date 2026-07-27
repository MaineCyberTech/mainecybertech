# Deep Audit / Hardening Prompt: AI Ticket Intake Triage Assistant

Audit the **AI Ticket Intake Triage Assistant** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Transforms vague client requests into structured tickets with category, priority, missing information, and suggested first response.
Primary users: Service desk, client users
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*ai_ticket_intake_triage_assistant*.sql`
- `apps/api/src/routes/ai-ticket-intake-triage-assistant.ts`
- `apps/api/src/validators/ai-ticket-intake-triage-assistant.ts`
- `apps/api/src/services/ai-ticket-intake-triage-assistant.ts`
- `packages/sdk/src/ai-ticket-intake-triage-assistant.ts`
- `apps/web/app/(portal)/portal/ai-ticket-intake-triage-assistant/**/*`
- `apps/web/components/portal/AiTicketIntakeTriageAssistant/**/*`
- `apps/worker/src/tasks/ai-ticket-intake-triage-assistant.ts` if present
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
