# Deep Audit / Hardening Prompt: Backup Disaster Recovery Review Dashboard

Audit the **Backup Disaster Recovery Review Dashboard** implementation in the MaineCyberTech portal/OS monorepo.

## Module context

Purpose: Track protected systems, last backup, failures, restore testing, RPO/RTO, retention, and backup risk.
Primary users: MSP admin, client leadership
Components: api,web,sdk,worker,db

## Review scope

Inspect all related files:

- `supabase/migrations/*backup_disaster_recovery_review_dashboard*.sql`
- `apps/api/src/routes/backup-disaster-recovery-review-dashboard.ts`
- `apps/api/src/validators/backup-disaster-recovery-review-dashboard.ts`
- `apps/api/src/services/backup-disaster-recovery-review-dashboard.ts`
- `packages/sdk/src/backup-disaster-recovery-review-dashboard.ts`
- `apps/web/app/(portal)/portal/backup-disaster-recovery-review-dashboard/**/*`
- `apps/web/components/portal/BackupDisasterRecoveryReviewDashboard/**/*`
- `apps/worker/src/tasks/backup-disaster-recovery-review-dashboard.ts` if present
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
