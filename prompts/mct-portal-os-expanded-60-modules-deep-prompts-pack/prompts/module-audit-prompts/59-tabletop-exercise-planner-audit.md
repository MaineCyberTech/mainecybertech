# Deep Audit / Hardening Prompt: Tabletop Exercise Planner

Audit the **Tabletop Exercise Planner** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Plans cybersecurity/business continuity tabletop exercises with scenarios, roles, injects, notes, action items, and after-action reports.
Primary users: MSP advisor, client leadership
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*tabletop_exercise_planner*.sql`
- `apps/api/src/routes/tabletop-exercise-planner.ts`
- `apps/api/src/validators/tabletop-exercise-planner.ts`
- `apps/api/src/services/tabletop-exercise-planner.ts`
- `packages/sdk/src/tabletop-exercise-planner.ts`
- `apps/web/app/(portal)/portal/tabletop-exercise-planner/**/*`
- `apps/web/components/portal/TabletopExercisePlanner/**/*`
- `apps/worker/src/tasks/tabletop-exercise-planner.ts` if present
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
