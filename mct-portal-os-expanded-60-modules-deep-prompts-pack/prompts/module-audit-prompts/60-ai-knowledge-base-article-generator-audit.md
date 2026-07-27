# Deep Audit / Hardening Prompt: AI Knowledge Base Article Generator

Audit the **AI Knowledge Base Article Generator** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Converts resolved tickets, runbooks, and SOP notes into draft KB articles with review workflow and client/internal visibility controls.
Primary users: Service desk, KB owner
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*ai_knowledge_base_article_generator*.sql`
- `apps/api/src/routes/ai-knowledge-base-article-generator.ts`
- `apps/api/src/validators/ai-knowledge-base-article-generator.ts`
- `apps/api/src/services/ai-knowledge-base-article-generator.ts`
- `packages/sdk/src/ai-knowledge-base-article-generator.ts`
- `apps/web/app/(portal)/portal/ai-knowledge-base-article-generator/**/*`
- `apps/web/components/portal/AiKnowledgeBaseArticleGenerator/**/*`
- `apps/worker/src/tasks/ai-knowledge-base-article-generator.ts` if present
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
