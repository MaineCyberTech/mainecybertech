# Deep Audit / Hardening Prompt: Client Knowledge Base Self-Service Assistant

Audit the **Client Knowledge Base Self-Service Assistant** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Client-specific KB, approved self-help guides, article feedback, ticket-deflection workflow, and support education.
Primary users: Client end users, service desk
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*client_knowledge_base_self_service_assistant*.sql`
- `apps/api/src/routes/client-knowledge-base-self-service-assistant.ts`
- `apps/api/src/validators/client-knowledge-base-self-service-assistant.ts`
- `apps/api/src/services/client-knowledge-base-self-service-assistant.ts`
- `packages/sdk/src/client-knowledge-base-self-service-assistant.ts`
- `apps/web/app/(portal)/portal/client-knowledge-base-self-service-assistant/**/*`
- `apps/web/components/portal/ClientKnowledgeBaseSelfServiceAssistant/**/*`
- `apps/worker/src/tasks/client-knowledge-base-self-service-assistant.ts` if present
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
