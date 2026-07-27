# Deep Audit / Hardening Prompt: PowerShell Script Builder Policy Guard

Audit the **PowerShell Script Builder Policy Guard** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Generates and reviews PowerShell scripts against internal safety rules, logging standards, rollback expectations, and approval gates.
Primary users: Automation engineer, MSP admin
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*powershell_script_builder_policy_guard*.sql`
- `apps/api/src/routes/powershell-script-builder-policy-guard.ts`
- `apps/api/src/validators/powershell-script-builder-policy-guard.ts`
- `apps/api/src/services/powershell-script-builder-policy-guard.ts`
- `packages/sdk/src/powershell-script-builder-policy-guard.ts`
- `apps/web/app/(portal)/portal/powershell-script-builder-policy-guard/**/*`
- `apps/web/components/portal/PowershellScriptBuilderPolicyGuard/**/*`
- `apps/worker/src/tasks/powershell-script-builder-policy-guard.ts` if present
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
