# Deep Audit / Hardening Prompt: Fun Cyber Scoreboard Mascot

Audit the **Fun Cyber Scoreboard Mascot** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Gamified client security dashboard with badges, progress bars, mascot-style encouragement, and cyber hygiene goals.
Primary users: Client users, MSP advisor
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*fun_cyber_scoreboard_mascot*.sql`
- `apps/api/src/routes/fun-cyber-scoreboard-mascot.ts`
- `apps/api/src/validators/fun-cyber-scoreboard-mascot.ts`
- `apps/api/src/services/fun-cyber-scoreboard-mascot.ts`
- `packages/sdk/src/fun-cyber-scoreboard-mascot.ts`
- `apps/web/app/(portal)/portal/fun-cyber-scoreboard-mascot/**/*`
- `apps/web/components/portal/FunCyberScoreboardMascot/**/*`
- `apps/worker/src/tasks/fun-cyber-scoreboard-mascot.ts` if present
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
