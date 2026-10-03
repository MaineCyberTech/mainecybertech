# Deep Audit / Hardening Prompt: Cyber Insurance Evidence Binder

Audit the **Cyber Insurance Evidence Binder** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Collects and organizes evidence commonly requested for cyber insurance questionnaires, renewals, and attestations.
Primary users: MSP advisor, client executive
Components: api,web,sdk,db

## Review scope

Inspect all related files:

- `supabase/migrations/*cyber_insurance_evidence_binder*.sql`
- `apps/api/src/routes/cyber-insurance-evidence-binder.ts`
- `apps/api/src/validators/cyber-insurance-evidence-binder.ts`
- `apps/api/src/services/cyber-insurance-evidence-binder.ts`
- `packages/sdk/src/cyber-insurance-evidence-binder.ts`
- `apps/web/app/(portal)/portal/cyber-insurance-evidence-binder/**/*`
- `apps/web/components/portal/CyberInsuranceEvidenceBinder/**/*`
- `apps/worker/src/tasks/cyber-insurance-evidence-binder.ts` if present
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
